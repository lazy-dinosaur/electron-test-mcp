#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  _electron,
  chromium,
  ElectronApplication,
  Page,
  Browser,
} from "playwright";

let electronApp: ElectronApplication | null = null;
let cdpBrowser: Browser | null = null;
let page: Page | null = null;
let connectionMode: "electron" | "cdp" | null = null;

const server = new Server(
  { name: "electron-test-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "connect",
      description:
        "Connect to already running Electron app via CDP (e.g., bun run dev:local with --remote-debugging-port)",
      inputSchema: {
        type: "object",
        properties: {
          port: {
            type: "number",
            description: "CDP port (default: 9222)",
          },
        },
      },
    },
    {
      name: "launch",
      description:
        "Launch Electron app for testing (builds and runs fresh instance)",
      inputSchema: {
        type: "object",
        properties: {
          appPath: {
            type: "string",
            description:
              "Path to Electron main.js (default: ./out/main/index.js)",
          },
          env: {
            type: "object",
            description: "Environment variables to pass to the app",
          },
          headless: {
            type: "boolean",
            description:
              "Run in headless mode (no visible window, for CI/automation)",
          },
        },
      },
    },
    {
      name: "disconnect",
      description: "Disconnect from CDP (does not close the app)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "close",
      description:
        "Close the Electron app (only works with launch, not connect)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "screenshot",
      description: "Take a screenshot of the current window",
      inputSchema: {
        type: "object",
        properties: {
          fullPage: {
            type: "boolean",
            description: "Capture full scrollable page",
          },
        },
      },
    },
    {
      name: "snapshot",
      description:
        "Get accessibility tree snapshot of the page (for finding elements)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "click",
      description: "Click an element",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: 'CSS selector or text selector (e.g., "text=Submit")',
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "fill",
      description: "Fill text into an input field",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the input",
          },
          text: { type: "string", description: "Text to fill" },
        },
        required: ["selector", "text"],
      },
    },
    {
      name: "type",
      description: "Type text character by character (triggers key events)",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the input",
          },
          text: { type: "string", description: "Text to type" },
        },
        required: ["selector", "text"],
      },
    },
    {
      name: "hover",
      description: "Hover over an element",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector" },
        },
        required: ["selector"],
      },
    },
    {
      name: "press",
      description: "Press a keyboard key",
      inputSchema: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: 'Key to press (e.g., "Enter", "Escape", "Control+S")',
          },
        },
        required: ["key"],
      },
    },
    {
      name: "wait",
      description: "Wait for an element or condition",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector to wait for" },
          state: {
            type: "string",
            enum: ["visible", "hidden", "attached", "detached"],
            description: "State to wait for (default: visible)",
          },
          timeout: {
            type: "number",
            description: "Timeout in ms (default: 5000)",
          },
        },
        required: ["selector"],
      },
    },
    {
      name: "getText",
      description: "Get text content of an element",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector" },
        },
        required: ["selector"],
      },
    },
    {
      name: "evaluate",
      description: "Execute JavaScript in the renderer process",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string", description: "JavaScript code to execute" },
        },
        required: ["script"],
      },
    },
    {
      name: "evaluateMain",
      description: "Execute code in the Electron main process",
      inputSchema: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description:
              "Code to execute (receives { app, ipcMain, dialog, BrowserWindow })",
          },
        },
        required: ["script"],
      },
    },
    {
      name: "drag",
      description: "Drag and drop from source to target element",
      inputSchema: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "CSS selector for source element to drag",
          },
          target: {
            type: "string",
            description: "CSS selector for target drop zone",
          },
        },
        required: ["source", "target"],
      },
    },
    {
      name: "selectOption",
      description: "Select option(s) from a dropdown",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for select element",
          },
          value: {
            type: "string",
            description: "Value or label to select",
          },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "getAttribute",
      description: "Get attribute value of an element",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector" },
          attribute: { type: "string", description: "Attribute name" },
        },
        required: ["selector", "attribute"],
      },
    },
    {
      name: "isVisible",
      description: "Check if element is visible",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector" },
        },
        required: ["selector"],
      },
    },
    {
      name: "count",
      description: "Count elements matching selector",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector" },
        },
        required: ["selector"],
      },
    },
    {
      name: "scroll",
      description: "Scroll the page using mouse wheel",
      inputSchema: {
        type: "object",
        properties: {
          deltaX: {
            type: "number",
            description: "Horizontal scroll amount (positive = right, negative = left)",
          },
          deltaY: {
            type: "number",
            description: "Vertical scroll amount (positive = down, negative = up)",
          },
        },
      },
    },
    {
      name: "scrollTo",
      description: "Scroll to absolute position on the page",
      inputSchema: {
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "Horizontal position in pixels (default: 0)",
          },
          y: {
            type: "number",
            description: "Vertical position in pixels (default: 0)",
          },
          behavior: {
            type: "string",
            enum: ["auto", "smooth"],
            description: "Scroll behavior (default: auto)",
          },
        },
      },
    },
    {
      name: "scrollIntoView",
      description: "Scroll element into view",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector for the element to scroll into view",
          },
        },
        required: ["selector"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "connect": {
        if (page) {
          return {
            content: [
              { type: "text", text: "Already connected. Disconnect first." },
            ],
          };
        }

        const port = (args?.port as number) || 9222;

        cdpBrowser = await chromium.connectOverCDP(`http://localhost:${port}`);
        const contexts = cdpBrowser.contexts();
        if (contexts.length === 0) {
          return {
            content: [{ type: "text", text: "No browser contexts found." }],
          };
        }

        const pages = contexts[0].pages();
        if (pages.length === 0) {
          return { content: [{ type: "text", text: "No pages found." }] };
        }

        page = pages[0];
        connectionMode = "cdp";

        return {
          content: [
            {
              type: "text",
              text: `Connected via CDP (port ${port}). Window title: ${await page.title()}`,
            },
          ],
        };
      }

      case "disconnect": {
        if (cdpBrowser) {
          await cdpBrowser.close();
          cdpBrowser = null;
          page = null;
          connectionMode = null;
        }
        return { content: [{ type: "text", text: "Disconnected from CDP." }] };
      }

      case "launch": {
        if (page) {
          return {
            content: [
              {
                type: "text",
                text: "Already connected. Disconnect/close first.",
              },
            ],
          };
        }

        const appPath = (args?.appPath as string) || "./out/main/index.js";
        const env = (args?.env as Record<string, string>) || {};
        const headless = (args?.headless as boolean) || false;

        const launchArgs = ["--ozone-platform=x11", appPath];
        if (headless) {
          launchArgs.unshift("--headless=new", "--disable-gpu");
        }

        electronApp = await _electron.launch({
          args: launchArgs,
          env: { ...process.env, ...env, TEST_MODE: "true" },
        });

        page = await electronApp.firstWindow();
        connectionMode = "electron";
        await page.waitForLoadState("domcontentloaded");

        return {
          content: [
            {
              type: "text",
              text: `App launched${headless ? " (headless)" : ""}. Window title: ${await page.title()}`,
            },
          ],
        };
      }

      case "close": {
        if (connectionMode === "cdp") {
          return {
            content: [
              {
                type: "text",
                text: "Cannot close CDP connection. Use disconnect instead (app keeps running).",
              },
            ],
          };
        }
        if (electronApp) {
          await electronApp.close();
          electronApp = null;
          page = null;
          connectionMode = null;
        }
        return { content: [{ type: "text", text: "App closed." }] };
      }

      case "screenshot": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const buffer = await page.screenshot({
          fullPage: (args?.fullPage as boolean) || false,
        });

        return {
          content: [
            {
              type: "image",
              data: buffer.toString("base64"),
              mimeType: "image/png",
            },
          ],
        };
      }

      case "snapshot": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const snapshot = await page.locator("body").ariaSnapshot();
        return {
          content: [{ type: "text", text: snapshot }],
        };
      }

      case "click": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        await page.click(selector);
        return { content: [{ type: "text", text: `Clicked: ${selector}` }] };
      }

      case "fill": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const text = args?.text as string;
        await page.fill(selector, text);
        return {
          content: [
            { type: "text", text: `Filled "${text}" into ${selector}` },
          ],
        };
      }

      case "type": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const text = args?.text as string;
        await page.locator(selector).pressSequentially(text);
        return {
          content: [{ type: "text", text: `Typed "${text}" into ${selector}` }],
        };
      }

      case "hover": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        await page.hover(selector);
        return { content: [{ type: "text", text: `Hovered: ${selector}` }] };
      }

      case "press": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const key = args?.key as string;
        await page.keyboard.press(key);
        return { content: [{ type: "text", text: `Pressed: ${key}` }] };
      }

      case "wait": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const state =
          (args?.state as "visible" | "hidden" | "attached" | "detached") ||
          "visible";
        const timeout = (args?.timeout as number) || 5000;

        await page.locator(selector).waitFor({ state, timeout });
        return {
          content: [{ type: "text", text: `Element ${selector} is ${state}` }],
        };
      }

      case "getText": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const text = await page.locator(selector).textContent();
        return { content: [{ type: "text", text: text || "(empty)" }] };
      }

      case "evaluate": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const script = args?.script as string;
        const result = await page.evaluate(script);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "evaluateMain": {
        if (connectionMode === "cdp") {
          return {
            content: [
              {
                type: "text",
                text: "evaluateMain is not available in CDP mode. Main process access requires launch mode.",
              },
            ],
          };
        }
        if (!electronApp)
          return {
            content: [
              { type: "text", text: "Not connected. Call launch first." },
            ],
          };

        const script = args?.script as string;
        const fn = new Function("electron", `return (${script})(electron)`);
        const result = await electronApp.evaluate(fn as any);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "drag": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const source = args?.source as string;
        const target = args?.target as string;
        await page.dragAndDrop(source, target);
        return {
          content: [{ type: "text", text: `Dragged ${source} to ${target}` }],
        };
      }

      case "selectOption": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const value = args?.value as string;
        await page.selectOption(selector, value);
        return {
          content: [
            { type: "text", text: `Selected "${value}" in ${selector}` },
          ],
        };
      }

      case "getAttribute": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const attribute = args?.attribute as string;
        const value = await page.locator(selector).getAttribute(attribute);
        return { content: [{ type: "text", text: value || "(null)" }] };
      }

      case "isVisible": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const visible = await page.locator(selector).isVisible();
        return { content: [{ type: "text", text: String(visible) }] };
      }

      case "count": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        const count = await page.locator(selector).count();
        return { content: [{ type: "text", text: String(count) }] };
      }

      case "scroll": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const deltaX = (args?.deltaX as number) || 0;
        const deltaY = (args?.deltaY as number) || 0;
        await page.mouse.wheel(deltaX, deltaY);
        return {
          content: [
            { type: "text", text: `Scrolled by (${deltaX}, ${deltaY})` },
          ],
        };
      }

      case "scrollTo": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const x = (args?.x as number) || 0;
        const y = (args?.y as number) || 0;
        const behavior = (args?.behavior as "auto" | "smooth") || "auto";
        await page.evaluate(
          ({ x, y, behavior }) => window.scrollTo({ left: x, top: y, behavior }),
          { x, y, behavior },
        );
        return {
          content: [
            { type: "text", text: `Scrolled to position (${x}, ${y})` },
          ],
        };
      }

      case "scrollIntoView": {
        if (!page)
          return {
            content: [
              {
                type: "text",
                text: "Not connected. Call connect or launch first.",
              },
            ],
          };

        const selector = args?.selector as string;
        await page.locator(selector).scrollIntoViewIfNeeded();
        return {
          content: [
            { type: "text", text: `Scrolled ${selector} into view` },
          ],
        };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: `Error: ${message}` }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

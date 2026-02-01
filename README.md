# electron-test-mcp

MCP (Model Context Protocol) server for testing Electron applications using Playwright.

## Features

- **Two connection modes:**
  - **CDP Mode**: Connect to a running Electron app via Chrome DevTools Protocol
  - **Launch Mode**: Launch a fresh Electron app instance for testing
- **Full Playwright API**: screenshot, click, fill, type, hover, press, wait, evaluate, and more
- **Accessibility snapshots**: Get the accessibility tree for element discovery
- **Main process access**: Execute code in Electron's main process (launch mode only)

## Installation

```bash
npm install -g electron-test-mcp
# or
npx electron-test-mcp
```

## Usage with Claude Desktop / MCP Clients

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "electron-test": {
      "command": "npx",
      "args": ["electron-test-mcp"]
    }
  }
}
```

## Connection Modes

### CDP Mode (Recommended for Development)

Connect to an already running Electron app with remote debugging enabled:

```bash
# Start your Electron app with debugging port
electron your-app --remote-debugging-port=9222

# Or with electron-vite
electron-vite dev -- --remote-debugging-port=9222
```

Then use the `connect` tool:

```
connect({ port: 9222 })
```

**Pros:**

- Works with your existing dev workflow
- App state preserved between tests
- Hot reload still works

### Launch Mode

Launch a fresh Electron app instance:

```
launch({ appPath: "./out/main/index.js" })
```

**Pros:**

- Clean state for each test
- Access to main process via `evaluateMain`
- Can pass custom environment variables

## Available Tools

### Connection

| Tool         | Description                             |
| ------------ | --------------------------------------- |
| `connect`    | Connect to running app via CDP          |
| `disconnect` | Disconnect from CDP (app keeps running) |
| `launch`     | Launch new Electron app instance        |
| `close`      | Close launched app                      |

### Interaction

| Tool           | Description                         |
| -------------- | ----------------------------------- |
| `click`        | Click an element                    |
| `fill`         | Fill text into input (clears first) |
| `type`         | Type text character by character    |
| `hover`        | Hover over an element               |
| `press`        | Press keyboard key                  |
| `drag`         | Drag and drop                       |
| `selectOption` | Select from dropdown                |

### Inspection

| Tool           | Description                            |
| -------------- | -------------------------------------- |
| `screenshot`   | Take screenshot (returns base64 image) |
| `snapshot`     | Get accessibility tree                 |
| `getText`      | Get element text content               |
| `getAttribute` | Get element attribute                  |
| `isVisible`    | Check if element is visible            |
| `count`        | Count matching elements                |

### Advanced

| Tool           | Description                                 |
| -------------- | ------------------------------------------- |
| `wait`         | Wait for element state                      |
| `evaluate`     | Run JS in renderer process                  |
| `evaluateMain` | Run code in main process (launch mode only) |

## Selectors

Supports all Playwright selectors:

```
# CSS selectors
[data-testid="submit-btn"]
.my-class
#my-id

# Text selectors
text=Submit
text="Exact Match"

# Role selectors
role=button[name="Submit"]

# Combining
.form >> text=Submit
```

## Examples

### Basic Test Flow

```
1. connect({ port: 9222 })
2. snapshot()  // See the page structure
3. click('[data-testid="login-btn"]')
4. fill('[data-testid="email"]', 'test@example.com')
5. fill('[data-testid="password"]', 'password123')
6. click('text=Sign In')
7. wait({ selector: '[data-testid="dashboard"]' })
8. screenshot()
```

### Main Process Access (Launch Mode)

```javascript
// Get app version
evaluateMain({
  script: "({ app }) => app.getVersion()",
});

// Show dialog
evaluateMain({
  script: "({ dialog }) => dialog.showMessageBox({ message: 'Hello!' })",
});
```

## Tips for Testable Electron Apps

1. **Add `data-testid` attributes** to important elements
2. **Enable remote debugging** in development: `--remote-debugging-port=9222`
3. **Use semantic HTML** for better accessibility snapshots
4. **Keep selectors stable** - prefer `data-testid` over classes

## License

MIT

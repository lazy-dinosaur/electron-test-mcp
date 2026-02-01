# AGENTS.md - electron-test-mcp

> MCP server for testing Electron applications via Playwright.
> Single-file TypeScript project (~725 LOC).

## Quick Reference

```bash
# Build
npm run build          # TypeScript compilation (tsc)
bun run build          # Alternative with bun

# Run locally (after build)
node dist/index.js

# Run via npx (published)
npx electron-test-mcp
```

## Project Structure

```
electron-test-mcp/
├── src/
│   └── index.ts       # Single source file - entire MCP server
├── dist/              # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Build & Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run prepublishOnly` | Auto-runs build before npm publish |

### No Test Suite

This project currently has no automated tests. Manual testing:
1. Build: `npm run build`
2. Start an Electron app with `--remote-debugging-port=9222`
3. Run: `node dist/index.js`
4. Send MCP requests via stdin

### No Linting/Formatting

No ESLint or Prettier configured. Follow the existing code patterns.

## Code Style Guidelines

### TypeScript Configuration

```json
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "Node",
  "strict": true,
  "esModuleInterop": true,
  "skipLibCheck": true,
  "declaration": true
}
```

### Imports

```typescript
// SDK imports - use .js extension (ESM requirement)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Playwright - named imports
import { _electron, chromium, ElectronApplication, Page, Browser } from "playwright";
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `electronApp`, `cdpBrowser` |
| Functions | camelCase | `main()` |
| Types | PascalCase | `ElectronApplication`, `Page` |
| Tool names | camelCase | `"getText"`, `"evaluateMain"` |
| Constants | camelCase (module-level state) | `let page: Page \| null = null` |

### Module-Level State

State is managed at module level with explicit null initialization:

```typescript
let electronApp: ElectronApplication | null = null;
let cdpBrowser: Browser | null = null;
let page: Page | null = null;
let connectionMode: "electron" | "cdp" | null = null;
```

### Error Handling

```typescript
try {
  // operation
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: `Error: ${message}` }] };
}
```

### Precondition Checks (Early Returns)

```typescript
case "click": {
  if (!page)
    return {
      content: [
        { type: "text", text: "Not connected. Call connect or launch first." },
      ],
    };
  // ... actual logic
}
```

### Response Format

All tool handlers return MCP-formatted responses:

```typescript
return {
  content: [{ type: "text", text: `Clicked: ${selector}` }],
};

// For images
return {
  content: [
    { type: "image", data: buffer.toString("base64"), mimeType: "image/png" },
  ],
};
```

### Formatting Patterns

- **Trailing commas**: Always in objects and arrays
- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Template literals**: For string interpolation
- **Line length**: ~80-100 chars (soft limit)

```typescript
// Good
const port = (args?.port as number) || 9222;
return { content: [{ type: "text", text: `Connected via CDP (port ${port})` }] };

// Multiline when needed
return {
  content: [
    {
      type: "text",
      text: `App launched${headless ? " (headless)" : ""}. Window title: ${await page.title()}`,
    },
  ],
};
```

### Type Assertions

Use `as` for type narrowing from `args`:

```typescript
const selector = args?.selector as string;
const port = (args?.port as number) || 9222;
const env = (args?.env as Record<string, string>) || {};
```

## MCP Tool Pattern

### Tool Definition

```typescript
{
  name: "toolName",
  description: "Clear description of what the tool does",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Parameter description" },
    },
    required: ["param"],  // Only if required
  },
}
```

### Tool Handler

```typescript
case "toolName": {
  // 1. Check preconditions
  if (!page)
    return { content: [{ type: "text", text: "Not connected." }] };

  // 2. Extract args
  const param = args?.param as string;

  // 3. Execute action
  await page.someAction(param);

  // 4. Return result
  return { content: [{ type: "text", text: `Done: ${param}` }] };
}
```

## Architecture Notes

### Connection Modes

1. **CDP Mode**: Connect to running Electron via Chrome DevTools Protocol
   - Uses `chromium.connectOverCDP()`
   - Cannot access main process
   - App keeps running on disconnect

2. **Launch Mode**: Launch fresh Electron instance
   - Uses `_electron.launch()`
   - Full main process access via `evaluateMain`
   - App closes on close

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation |
| `playwright` | Browser/Electron automation |

## Common Gotchas

1. **ESM imports**: Always use `.js` extension for SDK imports
2. **Page null check**: Every tool must check `if (!page)` first
3. **CDP vs Launch**: `evaluateMain` only works in launch mode
4. **Headless args**: Must be passed before appPath in launch args

## Available Tools Summary

### Connection
`connect`, `disconnect`, `launch`, `close`

### Interaction
`click`, `fill`, `type`, `hover`, `press`, `drag`, `selectOption`

### Scroll
`scroll`, `scrollTo`, `scrollIntoView`

### Inspection
`screenshot`, `snapshot`, `getText`, `getAttribute`, `isVisible`, `count`, `wait`

### Advanced
`evaluate`, `evaluateMain`

## Adding New Tools

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add case to switch statement in `CallToolRequestSchema` handler
3. Follow existing patterns for precondition checks and responses
4. Ensure proper type narrowing for args

## Git Workflow

- No specific branch strategy documented
- Single main/master branch assumed
- Commit messages: Keep them descriptive

---

*Last updated: 2026-02-01*

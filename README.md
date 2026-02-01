# Electron Test MCP

[![npm version](https://img.shields.io/npm/v/electron-test-mcp.svg)](https://www.npmjs.com/package/electron-test-mcp)
[![npm downloads](https://img.shields.io/npm/dm/electron-test-mcp.svg)](https://www.npmjs.com/package/electron-test-mcp)
[![GitHub stars](https://img.shields.io/github/stars/lazy-dinosaur/electron-test-mcp.svg)](https://github.com/lazy-dinosaur/electron-test-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어 버전 (Korean)](README.ko.md)

MCP (Model Context Protocol) server for testing Electron applications using Playwright. Enables AI models like Claude to interact with and test your Electron apps.

## 🚀 Quick Start

```bash
# Run directly with npx
npx electron-test-mcp

# Or install globally
npm install -g electron-test-mcp
electron-test-mcp
```

## Features

- **Two Connection Modes**
  - **CDP Mode**: Connect to a running Electron app via Chrome DevTools Protocol
  - **Launch Mode**: Launch a fresh Electron app instance for testing
- **Full Playwright API**: screenshot, click, fill, type, hover, press, wait, evaluate, and more
- **Accessibility Snapshots**: Get the accessibility tree for element discovery
- **Main Process Access**: Execute code in Electron's main process (launch mode only)

## How It Works

```
User <--> AI Model (Claude) <--> MCP Protocol <--> electron-test-mcp <--> Electron App
```

1. **User**: "Click the login button and fill in the email field"
2. **AI Model**: Determines which MCP tools to use
3. **MCP Protocol**: Standardized communication
4. **electron-test-mcp**: Executes Playwright commands on the Electron app
5. **Electron App**: Actions are performed in the actual application

## Configuration

### Claude Desktop / MCP Clients

Add to your MCP configuration file:

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

### OpenCode

```json
{
  "mcp": {
    "electron-test": {
      "type": "local",
      "command": ["npx", "electron-test-mcp"],
      "enabled": true
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

**Advantages:**

- Works with your existing dev workflow
- App state preserved between tests
- Hot reload still works

### Launch Mode

Launch a fresh Electron app instance:

```
launch({ appPath: "./out/main/index.js" })
```

**Advantages:**

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

## Usage Examples

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

### With AI Assistant

You can ask Claude or other AI assistants to test your Electron app:

```
Connect to my Electron app running on port 9222 and:
1. Take a screenshot of the current state
2. Click the "Settings" button in the sidebar
3. Change the theme to dark mode
4. Verify the theme changed by checking the background color
```

## Tips for Testable Electron Apps

1. **Add `data-testid` attributes** to important elements
2. **Enable remote debugging** in development: `--remote-debugging-port=9222`
3. **Use semantic HTML** for better accessibility snapshots
4. **Keep selectors stable** - prefer `data-testid` over classes

## Development

```bash
# Clone repository
git clone https://github.com/lazy-dinosaur/electron-test-mcp.git
cd electron-test-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

Distributed under the MIT License. See LICENSE file for more information.

## ❤️ Support

If you find this project useful, please consider giving it a ⭐️ on GitHub!

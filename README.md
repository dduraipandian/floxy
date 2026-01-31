# floxy

[![Tests](https://github.com/dduraipandian/floxy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dduraipandian/floxy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18.16.0](https://img.shields.io/badge/node-%3E%3D%2018.16.0-brightgreen)](https://nodejs.org/)

A lightweight, opinionated composable Flow/Node editor. Built on top of Bootstrap 5, `floxy` provides a high-performance, reusable Flow component for building node-based interfaces with minimal configuration and native ES Module support.

## Features

- 🚀 **Performance Oriented** – Efficient DOM manipulation and clean lifecycle management
- 🎨 **Modern Aesthetics** – Professional styling with Bootstrap 5 integration
- � **Multiple Path Types** – Bezier curves, straight lines, and orthogonal connectors
- 📦 **Extensible** – Composite architecture for custom node views and behaviors
- ⚡ **Event Driven** – Robust event system for reacting to user interactions
- 🧪 **Well Tested** – Comprehensive unit test suite using Jest

---

## Getting Started

### Prerequisites

- **Node.js** v18.16.0 or higher
- **Modern browser** (Chrome 61+, Firefox 67+, Safari 11+, Edge 79+)

### Installation

```bash
git clone https://github.com/dduraipandian/floxy.git
cd floxy
npm install
npm run dev
# Visit http://localhost:8001
```

### Quick Start

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Flow App</title>
    <!-- Bootstrap 5 -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
    />
    <!-- Floxy styles -->
    <link rel="stylesheet" href="./dist/floxy.min.css" />
    <style>
      #flow-container {
        height: 600px;
        width: 100%;
        background: var(--floxy-app-bg);
      }
    </style>
  </head>
  <body>
    <div id="flow-container"></div>

    <!-- Floxy bundle -->
    <script src="./dist/floxy.min.js"></script>
    <script type="module">
      // Create flow instance
      const flow = new floxy.Flow({
        name: "MyFlow",
        options: {
          zoom: 1,
          connection: { pathType: "bezier" },
        },
      });

      // Render into container
      flow.renderInto("flow-container");

      // Add nodes
      const n1 = flow.addNode({
        name: "Start",
        label: "Start",
        x: 100,
        y: 100,
        inputs: 0,
        outputs: 1,
      });

      const n2 = flow.addNode({
        name: "Process",
        label: "Process",
        x: 400,
        y: 100,
        inputs: 1,
        outputs: 1,
      });

      const n3 = flow.addNode({
        name: "End",
        label: "End",
        x: 700,
        y: 100,
        inputs: 1,
        outputs: 0,
      });

      // Connect nodes
      flow.addConnection(n1, 0, n2, 0);
      flow.addConnection(n2, 0, n3, 0);
    </script>
  </body>
</html>
```

---

## API Overview

### Creating a Flow

```javascript
const flow = new Flow({
  name: "MyFlow",
  options: {
    zoom: 1, // Initial zoom level
    connection: { pathType: "bezier" }, // "bezier" | "line" | "orthogonal"
  },
});

flow.renderInto("container-id");
```

### Adding Nodes

```javascript
const nodeId = flow.addNode({
  name: "NodeType", // Node identifier
  label: "Display Name", // Visible label
  x: 100,
  y: 100, // Position
  inputs: 1, // Input port count
  outputs: 1, // Output port count
  data: {}, // Custom data
});
```

### Creating Connections

```javascript
// Connect node1's output port 0 to node2's input port 0
flow.addConnection(node1Id, 0, node2Id, 0);
```

### Listening to Events

```javascript
flow.on("node:moved", ({ id, x, y }) => {
  console.log(`Node ${id} moved to (${x}, ${y})`);
});

flow.on("connection:created", ({ outNodeId, inNodeId }) => {
  console.log(`Connected: ${outNodeId} → ${inNodeId}`);
});
```

### Import/Export

```javascript
// Export
const data = flow.export();

// Import
flow.import(data);
```

---

## Events Reference

| Event                 | Payload                                        |
| --------------------- | ---------------------------------------------- |
| `node:moved`          | `{ id, x, y }`                                 |
| `node:selected`       | `{ id }`                                       |
| `node:removed`        | `{ id }`                                       |
| `node:updated`        | `{ id, x, y, w, h }`                           |
| `connection:created`  | `{ id, outNodeId, outPort, inNodeId, inPort }` |
| `connection:removed`  | `{ id }`                                       |
| `connection:selected` | `{ id }`                                       |

---

## Connection Path Types

| Type         | Description                   |
| ------------ | ----------------------------- |
| `bezier`     | Smooth curved paths (default) |
| `line`       | Direct straight lines         |
| `orthogonal` | Right-angle connector paths   |

---

## Development

```bash
npm run dev      # Start dev server
npm test         # Run tests
npm run lint     # Run ESLint
npm run build    # Build production bundle
```

---

## Architecture

For detailed architecture documentation, see [Architecture Guide](src/components/README.md).

---

## Known Limitations

- Single node/connection selection only (multi-select planned)
- Orthogonal paths may overlap with target nodes during drawing

## Future Enhancements

- [ ] Multi-node selection
- [ ] Undo/Redo support
- [ ] Copy/Paste nodes
- [ ] Minimap navigation
- [ ] Touch/mobile improvements

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 61+     |
| Firefox | 67+     |
| Safari  | 11+     |
| Edge    | 79+     |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © 2025 [dduraipandian](https://github.com/dduraipandian). See [LICENSE](LICENSE) for details.

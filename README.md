# floxy
[![Tests](https://github.com/dduraipandian/floxy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dduraipandian/floxy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18.16.0](https://img.shields.io/badge/node-%3E%3D%2018.16.0-brightgreen)](https://nodejs.org/)

A lightweight, opinionated composable Flow/Node editor editor. Built on top of Bootstrap 5, `floxy` provides a high-performance, reusable Flow component for building node-based interfaces with minimal configuration and native ES Module support.

## Why floxy?

`floxy` is designed as a focused utility for building flow-based UIs like DAGs, workflow editors, and graph visualizations. It leverages Bootstrap 5 for styling and provides a clean, manager-based architecture for extending functionality.

## Features

- **🚀 Performance Oriented**: Efficient DOM manipulation and clean lifecycle management.
- **🎨 Modern Aesthetics**: Professional styling out of the box with Bootstrap 5 integration.
- **📂 Core Features**:
  - **Flow Editor**: Draggable nodes, zoom/pan canvas, and bezier connections.
  - **DAG Validation**: Built-in plugin for ensuring directed acyclic graphs.
  - **Extensible**: Plugin-based architecture for custom validators and managers.
  - **Event Driven**: Robust event system for reacting to node moves, connections, and deletions.
- **🧪 Robust Testing**: Comprehensive unit test suite using Jest and JSDOM.

## Getting Started

### Prerequisites

- **Node.js** (v18.16.0 or higher)
- **Modern browser** with ES Module support (all modern browsers: Chrome 61+, Firefox 67+, Safari 11+, Edge 79+)

### Installation

Clone locally for development:

```bash
git clone https://github.com/dduraipandian/floxy.git
cd floxy
npm install
```

### Quick Start

All components are ES Modules. Here's a simple example using the `Flow` component:

```html
<!-- In your HTML -->
<div id="flow-container" style="height: 600px; width: 100%;"></div>

<script type="module">
  import { Flow } from "./index.js";

  const flow = new Flow({
    name: "MainFlow",
    options: {
      zoom: 1,
    }
  });

  // Render into a container
  flow.renderInto("flow-container");

  // Add nodes
  const n1 = flow.addNode({ name: "Start", x: 100, y: 100, outputs: 1 });
  const n2 = flow.addNode({ name: "End", x: 400, y: 100, inputs: 1 });

  // Connect them
  flow.addConnection(n1, 0, n2, 0);
</script>
```

## Documentation

To run the interactive documentation and live demos locally:

```bash
npm install
npm run dev
# Visit http://localhost:8000 in your browser
```

## Development

### Running Tests

We use Jest and JSDOM for unit testing:

```bash
npm install  # Install dev dependencies
npm test     # Run full test suite
```

### Code Quality

```bash
npm run lint    # Run ESLint style checker
npm run format  # Auto-format code with Prettier
```

### Project Structure

| File/Directory   | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `src/base.js`    | Core component classes (`Component`, `EmitterComponent`)  |
| `src/flow.js`    | Main Flow component orchestrator                          |
| `src/components/`| Managers (node, connection, canvas, serializer)           |
| `src/css/`       | Component styles                                          |

## Contributing

Contributions are welcome!

## License

MIT © 2025 [dduraipandian](https://github.com/dduraipandian). See [LICENSE](LICENSE) for details.
>>>>>>> flow_refactoring_from_uiframe_1

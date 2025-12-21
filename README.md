# uiframe

A lightweight, opinionated composable UI framework for building professional web interfaces. Built on top of Bootstrap 5, `uiframe` provides high-performance, reusable UI components with minimal configuration and native ES Module support.

## Why uiframe?

`uiframe` is designed as a utility wrapper for Bootstrap 5. It provides a set of complex components (like resizable split panes, searchable dropdowns, and recursive trees) that are easy to drop into any project without the overhead of a heavy framework.

## Features

- **🚀 Performance Oriented**: Efficient DOM manipulation and clean lifecycle management.
- **🎨 Modern Aesthetics**: Professional styling out of the box with Bootstrap 5 integration.
- **📂 Component Library**:
  - **Table**: Feature-rich data grid with search, pagination, and JSON/CSV export.
  - **Tree**: Dynamic, recursive tree view with lazy loading and state persistence.
  - **ContextMenu**: Flexible right-click menus with async initialization.
  - **Tab**: Dynamic tab management for complex layouts.
  - **Spinner**: Customizable loading indicators with event handling.
  - **Online**: Real-time network status monitoring with automatic Toast notifications.
- **🧪 Robust Testing**: Comprehensive unit test suite using Jest and JSDOM.

## Getting Started

### Prerequisites

- Node.js (v24.12.0 or higher)
- A modern browser with ES Module support.

### Installation

1. Install via npm:
   ```bash
   npm install uiframe
   ```

### Quick Start

Each component is an ES Module. Here's how to use the `Spinner`:

```javascript
import { Spinner } from 'uiframe';

const mySpinner = new Spinner({ 
    name: 'MainLoader', 
    options: { loadingText: 'Loading data...', spinnerColor: 'text-primary' } 
});

// Render into a container
mySpinner.renderInto('app-container-id');

// Control visibility
mySpinner.show();
setTimeout(() => mySpinner.hide(), 2000);
```

## Documentation

To run the documentation site locally for development:

```bash
npm install
npm run dev
```
Then visit `http://localhost:8000`.

## Development

### Running Tests

We use Jest and JSDOM for unit testing. To run the full test suite:

```bash
npm test
```

### Components Structure

All core components are located in the `components/` directory:
- `base.js`: Core component classes (`Component`, `EmitterComponent`).
- `utils.js`: Shared utility functions.
- `table.js`, `tree.js`, `tab.js`, etc.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

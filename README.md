# uiframe

A lightweight, component-based frontend framework for building professional web interfaces. Built on top of Bootstrap 5, `uiframe` provides high-performance, reusable UI components with minimal configuration.

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
- Python 3.11+ (for documentation server)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/uiframe.git
   cd uiframe
   ```

2. Install development dependencies (for testing):
   ```bash
   npm install
   ```

3. Install documentation dependencies:
   ```bash
   pip install flask
   ```

## Usage

Each component is an ES Module. Here's a quick example of using the `Spinner`:

```javascript
import Spinner from './components/spinner.js';

const mySpinner = new Spinner({ 
    name: 'MainLoader', 
    options: { text: 'Loading data...' } 
});

// Render into a container
const container = document.getElementById('app');
mySpinner.renderInto(container);

// Control visibility
mySpinner.show();
mySpinner.hide();
```

## Documentation

To run the documentation site locally:

```bash
python app.py
```
Then visit `http://localhost:5001`.

## Development

### Running Tests

We use Jest and JSDOM for unit testing. To run the full test suite:

```bash
npm test
```

### Components

All core components are located in the `components/` directory:
- `base.js`: Core component classes (`Component`, `EmitterComponent`).
- `utils.js`: Shared utility functions (debounce, object path helpers).
- `table.js`, `tree.js`, `tab.js`, etc.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the `package.json` file for details.

import "./src/css/base.css";

import { SelectableBehavior as ConnectionSelectableBehavior } from "./src/components/connection/capabilities/behaviors/selectable.js";

import { DraggableBehavior } from "./src/components/node/capabilities/behaviors/draggable.js";
import { SelectableBehavior } from "./src/components/node/capabilities/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "./src/components/node/capabilities/behaviors/editable_label.js";
import { ResizableBehavior } from "./src/components/node/capabilities/behaviors/resizable.js";

import { defaultBehaviorRegistry as defaultNodeBehaviorRegistry } from "./src/components/node/capability.js";
import { defaultBehaviorRegistry as defaultConnectionBehaviorRegistry } from "./src/components/connection/capability.js";

// to register all paths
// eslint-disable-next-line no-unused-vars
import { pathRegistry } from "./src/components/connection/paths/index.js";

defaultNodeBehaviorRegistry.register(DraggableBehavior);
defaultNodeBehaviorRegistry.register(SelectableBehavior);
defaultNodeBehaviorRegistry.register(EditableLabelBehavior);
defaultNodeBehaviorRegistry.register(ResizableBehavior);

defaultConnectionBehaviorRegistry.register(ConnectionSelectableBehavior);

export { Flow } from "./src/flow.js";
export { DagValidator } from "./src/components/plugins/dag-validator.js";
export { ThemeManager } from "./src/components/theme.js";
export { ThemeEditor } from "./src/components/theme.js";

// register nodes
import { nodeViewRegistry } from "./src/components/node/NodeViewRegistry.js";
import { EllipseNodeView } from "./src/components/node/views/packages/workflow/EllipseNodeView.js";

nodeViewRegistry.register(EllipseNodeView);

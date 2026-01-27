import "./src/css/base.css";

import { DraggableBehavior } from "./src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "./src/components/node/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "./src/components/node/behaviors/EditableLabelBehavior.js";
import { ResizableBehavior } from "./src/components/node/behaviors/ResizableBehavior.js";

import { defaultBehaviorRegistry } from "./src/components/behaviors/BehaviorRegistry.js";

// to register all paths
// eslint-disable-next-line no-unused-vars
import { pathRegistry } from "./src/components/connection/paths/index.js";

defaultBehaviorRegistry.register(DraggableBehavior);
defaultBehaviorRegistry.register(SelectableBehavior);
defaultBehaviorRegistry.register(EditableLabelBehavior);
defaultBehaviorRegistry.register(ResizableBehavior);

export { Flow } from "./src/flow.js";
export { DagValidator } from "./src/components/plugins/dag-validator.js";
export { ThemeManager } from "./src/components/theme.js";
export { ThemeEditor } from "./src/components/theme.js";

// register nodes
import { nodeViewRegistry } from "./src/components/node/NodeViewRegistry.js";
import { EllipseNodeView } from "./src/components/node/views/packages/workflow/EllipseNodeView.js";

nodeViewRegistry.register(EllipseNodeView);

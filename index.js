import "./src/css/base.css";

import { DraggableBehavior } from "./src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "./src/components/node/behaviors/SelectableBehavior.js";
import { EditableLabelBehavior } from "./src/components/node/behaviors/EditableLabelBehavior.js";
import { BehaviorRegistry } from "./src/components/node/behaviors/BehaviorRegistry.js";
import { ResizableBehavior } from "./src/components/node/behaviors/ResizableBehavior.js";

// to register all paths
// eslint-disable-next-line no-unused-vars
import { pathRegistry } from "./src/components/connection/paths/index.js";

BehaviorRegistry.register(DraggableBehavior);
BehaviorRegistry.register(SelectableBehavior);
BehaviorRegistry.register(EditableLabelBehavior);
BehaviorRegistry.register(ResizableBehavior);

export { Flow } from "./src/flow.js";
export { DagValidator } from "./src/components/plugins/dag-validator.js";

// register nodes
import { nodeViewRegistry } from "./src/components/node/NodeViewRegistry.js";
import { EllipseNodeView } from "./src/components/node/views/packages/workflow/EllipseNodeView.js";

nodeViewRegistry.register(EllipseNodeView);

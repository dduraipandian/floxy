import "./src/css/base.css";

import { DraggableBehavior } from "./src/components/node/behaviors/DraggableBehavior.js";
import { SelectableBehavior } from "./src/components/node/behaviors/SelectableBehavior.js";
import { BehaviorRegistry } from "./src/components/node/behaviors/BehaviorRegistry.js";

BehaviorRegistry.register(DraggableBehavior);
BehaviorRegistry.register(SelectableBehavior);

export { Flow } from "./src/flow.js";
export { DagValidator } from "./src/components/plugins/dag-validator.js";

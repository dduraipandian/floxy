export { notification } from "@uiframe/notification";

export { Flow } from "./src/flow.js";
export { FlowCanvas } from "./src/components/canvas.js";
export { DagValidator } from "./src/components/plugins/dag-validator.js";

// eslint-disable-next-line import/extensions
import "@uiframe/core/style";

// eslint-disable-next-line import/extensions
import "@uiframe/notification/style";

import "./src/css/base.css";

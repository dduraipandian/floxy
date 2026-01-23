class FlowSerializer {
  export(flow) {
    const nodeManager = flow.nodeManager;
    const connectionManager = flow.connectionManager;
    const canvas = flow.canvas;

    const nodes = [];
    nodeManager.getAllNodes().forEach((node) => {
      nodes.push(node.model);
    });

    const connections = [];
    connectionManager.getAllConnections().forEach((node) => {
      connections.push(node.model);
    });

    return {
      nodes,
      connections,
      zoom: canvas.zoom,
      canvas: {
        x: canvas.canvasX,
        y: canvas.canvasY,
      },
    };
  }
  import(flow, data) {
    const { nodeManager, connectionManager, canvas } = flow;

    // 1. Reset canvas
    const zoom = data.zoom || 1;
    flow.zoom = zoom;
    canvas.zoom = zoom;
    nodeManager.zoom = zoom;
    connectionManager.zoom = zoom;

    canvas.canvasX = data.canvas?.x || 0;
    canvas.canvasY = data.canvas?.y || 0;
    canvas.redrawCanvas();

    // 2. Reset managers
    nodeManager.reset?.();
    connectionManager.reset?.();

    // 3. Recreate nodes
    if (data.nodes) {
      data.nodes.forEach((n) => {
        nodeManager.addNode(n);
      });
    }

    // 4. Recreate connections (validators already active)
    if (data.connections) {
      data.connections.forEach((c) => {
        flow.addConnection(c.outNodeId, c.outPort, c.inNodeId, c.inPort);
      });
    }
  }
}

export { FlowSerializer };

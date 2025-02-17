// Utility functions for vector operations in 2D.
function vecAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function vecSubtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function vecScale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

function vecLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// Graph structure:
// {
//    nodes: [ { pos: { x, y }, fixed: bool } ],
//    edges: [ { nodeA, nodeB } ],
//    initialEdgeLengths: [],
//    E_adj: [],
//    Ac: []
// }
export function generateRandomGraph(numNodes) {
  const graph = { nodes: [], edges: [] };
  console.log("Generating random graph with", numNodes, "nodes.");
  for (let i = 0; i < numNodes; i++) {
    graph.nodes.push({
      pos: { x: Math.random() * 800, y: Math.random() * 800 },
      fixed: false,
    });
  }
  // Randomly fix one node.
  const fixedIndex = Math.floor(Math.random() * numNodes);
  graph.nodes[fixedIndex].fixed = true;
  console.log("Fixed node at index:", fixedIndex);
  const edgeSet = new Set();
  while (edgeSet.size < numNodes) {
    const a = Math.floor(Math.random() * numNodes);
    const b = Math.floor(Math.random() * numNodes);
    if (a === b) continue;
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      graph.edges.push({ nodeA: a, nodeB: b });
    }
  }
  console.log("Generated edges:", graph.edges);
  return graph;
}

export function initCurve(graph) {
  const numNodes = graph.nodes.length;
  const numEdges = graph.edges.length;
  console.log(
    "Initializing curve connectivity with",
    numEdges,
    "edges and",
    numNodes,
    "nodes."
  );

  // Compute initial edge lengths.
  graph.initialEdgeLengths = new Array(numEdges);
  for (let i = 0; i < numEdges; i++) {
    const { nodeA, nodeB } = graph.edges[i];
    const posA = graph.nodes[nodeA].pos;
    const posB = graph.nodes[nodeB].pos;
    const dx = posB.x - posA.x,
      dy = posB.y - posA.y;
    graph.initialEdgeLengths[i] = Math.sqrt(dx * dx + dy * dy);
  }
  console.log("Initial edge lengths:", graph.initialEdgeLengths);

  // Build E_adj: for each node, store indices of incident edges.
  graph.E_adj = Array.from({ length: numNodes }, () => []);
  graph.edges.forEach((edge, i) => {
    graph.E_adj[edge.nodeA].push(i);
    graph.E_adj[edge.nodeB].push(i);
  });
  console.log("Computed E_adj:", graph.E_adj);

  // Build Ac: for each edge, list edges that are disjoint (no shared vertices).
  graph.Ac = Array.from({ length: graph.edges.length }, () => []);
  for (let e1 = 0; e1 < graph.edges.length; e1++) {
    const v1 = graph.edges[e1].nodeA;
    const v2 = graph.edges[e1].nodeB;
    for (let e2 = 0; e2 < graph.edges.length; e2++) {
      if (e1 === e2) continue;
      const a = graph.edges[e2].nodeA;
      const b = graph.edges[e2].nodeB;
      if (a !== v1 && a !== v2 && b !== v1 && b !== v2) {
        graph.Ac[e1].push(e2);
      }
    }
  }
  console.log("Computed Ac:", graph.Ac);
}

function computeEnergy(graph) {
  let energy = 0;
  graph.edges.forEach((edge) => {
    const { nodeA, nodeB } = edge;
    const posA = graph.nodes[nodeA].pos;
    const posB = graph.nodes[nodeB].pos;
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    energy += 1.0 / Math.pow(dist, 1);
  });
  console.log("Computed Energy:", energy);
  return energy;
}

function computeGradientForNode(graph, nodeIndex) {
  let grad = { x: 0, y: 0 };
  const curr = graph.nodes[nodeIndex].pos;
  graph.E_adj[nodeIndex].forEach((edgeIndex) => {
    const edge = graph.edges[edgeIndex];
    const otherIndex = edge.nodeA === nodeIndex ? edge.nodeB : edge.nodeA;
    const other = graph.nodes[otherIndex].pos;
    const dx = curr.x - other.x;
    const dy = curr.y - other.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1e-6) dist = 1e-6;
    grad.x += dx / (dist * dist * dist);
    grad.y += dy / (dist * dist * dist);
  });
  console.log(`Computed gradient for node ${nodeIndex}:`, grad);
  return grad;
}

// For debugging we use a simple update rule: update each non-fixed node position by subtracting
// a scaled gradient. This forces visible movement for debugging purposes.
export function repulsionIteration(graph, settings) {
  console.log("Running repulsionIteration...");
  const currentEnergy = computeEnergy(graph);
  const gradients = [];
  graph.nodes.forEach((node, i) => {
    if (node.fixed) {
      gradients[i] = { x: 0, y: 0 };
    } else {
      gradients[i] = computeGradientForNode(graph, i);
    }
  });
  console.log("Gradients:", gradients);

  // Update each non-fixed node using a fixed step update.
  graph.nodes.forEach((node, i) => {
    if (!node.fixed) {
      let oldPos = { ...node.pos };
      let delta = {
        x: settings.stepSize * gradients[i].x * settings.updateScale,
        y: settings.stepSize * gradients[i].y * settings.updateScale,
      };
      node.pos = {
        x: node.pos.x - delta.x,
        y: node.pos.y - delta.y,
      };
      console.log(
        `Node ${i} updated from`,
        oldPos,
        "to",
        node.pos,
        "with delta",
        delta
      );
    }
  });

  const newEnergy = computeEnergy(graph);
  console.log("Energy changed from", currentEnergy, "to", newEnergy);
  return Math.abs(newEnergy - currentEnergy) < settings.tolerance;
}

let optimizeRunning = false;
export function startOptimization(graph, settings, updateCallback) {
  console.log(
    "startOptimization: Starting loop with maxIterations",
    settings.maxIterations
  );
  optimizeRunning = true;
  let iter = 0;
  function loop() {
    if (!optimizeRunning || iter >= settings.maxIterations) {
      console.log(
        "Optimization loop terminated. optimizeRunning:",
        optimizeRunning,
        "iter:",
        iter
      );
      return;
    }
    const converged = repulsionIteration(graph, settings);
    updateCallback();
    iter++;
    console.log("Optimization iteration:", iter, "converged:", converged);
    if (!converged) {
      requestAnimationFrame(loop);
    } else {
      console.log("Optimization converged.");
      optimizeRunning = false;
    }
  }
  loop();
}

export function stopOptimization() {
  console.log("stopOptimization: Stopping optimization loop.");
  optimizeRunning = false;
}

export function drawGraph(ctx, graph) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  graph.edges.forEach((edge) => {
    const posA = graph.nodes[edge.nodeA].pos;
    const posB = graph.nodes[edge.nodeB].pos;
    ctx.beginPath();
    ctx.moveTo(posA.x, posA.y);
    ctx.lineTo(posB.x, posB.y);
    ctx.stroke();
  });
  graph.nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.pos.x, node.pos.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = node.fixed ? "#f00" : "#00f";
    ctx.fill();
  });
}

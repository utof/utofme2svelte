<script>
    import { onMount, onDestroy } from "svelte";
    import * as fabric from "fabric";
  
    // Global simulation variables and FabricJS canvas
    let canvas;
    let fabricCanvas;
    let nodes = [];
    let edges = [];
    let simulationInterval;
    let running = false;
  
    // Simulation and UI parameters
    let visualScale = 1.0;           // Controls curve shaping
    let numCircles = 10;             // Number of nodes
    let optimizeNodes = 1.0;         // 0: fixed nodes; 1: optimize nodes and curves
  
    // Utility: Generate nodes with random positions over the canvas
    function generateNodes(n) {
      const list = [];
      for (let i = 0; i < n; i++) {
        list.push({
          id: i,
          x: Math.random() * fabricCanvas.getWidth(),
          y: Math.random() * fabricCanvas.getHeight(),
          vx: 0,
          vy: 0,
          circle: null
        });
      }
      console.log("Generated nodes:", list);
      return list;
    }
  
    // Utility: Randomly connect nodes. Each node gets one or two connections.
    function generateEdges(nodes) {
      const list = [];
      const n = nodes.length;
      nodes.forEach((node) => {
        const connections = Math.floor(Math.random() * 2) + 1; // 1 or 2 connections
        for (let j = 0; j < connections; j++) {
          const target = nodes[Math.floor(Math.random() * n)];
          if (target.id !== node.id) { // avoid self-connections
            list.push({ from: node, to: target, curve: null });
          }
        }
      });
      console.log("Generated edges:", list);
      return list;
    }
  
    // Compute control point for quadratic Bezier curve using perpendicular bisector offset
    function calculateControlPoints(from, to, scale) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const offset = 0.3 * scale * len;
      // Perpendicular direction (normalized)
      const cx = midX - offset * (dy / len);
      const cy = midY + offset * (dx / len);
      return { cx, cy };
    }
  
    // Compute the midpoint of a quadratic bezier curve at t=0.5
    function bezierMidpoint(from, control, to) {
      const midX = (from.x + 2 * control.cx + to.x) / 4;
      const midY = (from.y + 2 * control.cy + to.y) / 4;
      return { x: midX, y: midY };
    }
  
    // Check for intersection energy between curves and apply extra forces if needed.
    function applyIntersectionEnergy() {
      const intersectionThreshold = 30;  // distance threshold for penalty
      const intersectionForceFactor = 0.05;
      // For each pair of edges (only if they don't share a node)
      for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
          const edge1 = edges[i];
          const edge2 = edges[j];
          // Skip if share a node
          if (
            edge1.from.id === edge2.from.id ||
            edge1.from.id === edge2.to.id ||
            edge1.to.id === edge2.from.id ||
            edge1.to.id === edge2.to.id
          ) {
            continue;
          }
          // Calculate control points for both curves
          const cp1 = calculateControlPoints(edge1.from, edge1.to, visualScale);
          const cp2 = calculateControlPoints(edge2.from, edge2.to, visualScale);
          // Calculate curve midpoints
          const mid1 = bezierMidpoint(edge1.from, cp1, edge1.to);
          const mid2 = bezierMidpoint(edge2.from, cp2, edge2.to);
  
          const dx = mid2.x - mid1.x;
          const dy = mid2.y - mid1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < intersectionThreshold) {
            // Log intersection detected
            console.log("Intersection energy applied between edges", edge1, edge2);
            // Compute a repulsive force proportional to the penetration (inversely related to distance)
            const force = intersectionForceFactor * (intersectionThreshold - dist);
            // Apply forces to all four nodes (distributed evenly)
            const fx = force * dx / (dist + 0.1);
            const fy = force * dy / (dist + 0.1);
            edge1.from.vx -= fx;
            edge1.from.vy -= fy;
            edge1.to.vx -= fx;
            edge1.to.vy -= fy;
            edge2.from.vx += fx;
            edge2.from.vy += fy;
            edge2.to.vx += fx;
            edge2.to.vy += fy;
          }
        }
      }
    }
  
    // Main simulation update function. Applies forces and updates FabricJS objects.
    function updateSimulation() {
      const repulsionForce = 0.5;
      const attractionForce = 0.01;
  
      // Only update node positions if optimizeNodes > 0. When 0 nodes remain fixed.
      if (optimizeNodes > 0) {
        // Apply repulsion between every pair of nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
            const force = repulsionForce / (dist * dist);
            const fx = force * dx;
            const fy = force * dy;
            nodes[i].vx -= fx * optimizeNodes;
            nodes[i].vy -= fy * optimizeNodes;
            nodes[j].vx += fx * optimizeNodes;
            nodes[j].vy += fy * optimizeNodes;
          }
        }
        
        // Apply attraction along the edges
        edges.forEach(edge => {
          const dx = edge.to.x - edge.from.x;
          const dy = edge.to.y - edge.from.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = attractionForce * dist;
          const fx = force * dx / dist;
          const fy = force * dy / dist;
          edge.from.vx += fx * optimizeNodes;
          edge.from.vy += fy * optimizeNodes;
          edge.to.vx -= fx * optimizeNodes;
          edge.to.vy -= fy * optimizeNodes;
        });
        
        // Update node positions and their FabricJS circles
        nodes.forEach(node => {
          node.vx *= 0.95; // damping
          node.vy *= 0.95;
          node.x += node.vx;
          node.y += node.vy;
          // Boundary check with inversion if out-of-bound
          if (node.x < 0 || node.x > fabricCanvas.getWidth()) node.vx *= -1;
          if (node.y < 0 || node.y > fabricCanvas.getHeight()) node.vy *= -1;
          if (node.circle) {
            node.circle.set({ left: node.x, top: node.y });
          }
        });
      }
  
      // Apply intersection energy between curves, regardless of node movement
      applyIntersectionEnergy();
  
      // Update curves (Bezier paths) for each edge with new control points
      edges.forEach(edge => {
        const { cx, cy } = calculateControlPoints(edge.from, edge.to, visualScale);
        if (edge.curve) {
          edge.curve.set({
            path: [
              ["M", edge.from.x, edge.from.y],
              ["Q", cx, cy, edge.to.x, edge.to.y]
            ]
          });
        }
      });
  
      fabricCanvas.renderAll();
      console.log("Simulation updated. Node positions:", nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
    }
  
    // Starts the simulation loop if not already running.
    function startSimulation() {
      if (running) return;
      simulationInterval = setInterval(updateSimulation, 50);
      running = true;
      console.log("Simulation started.");
    }
  
    // Stops the simulation loop.
    function stopSimulation() {
      clearInterval(simulationInterval);
      running = false;
      console.log("Simulation stopped.");
    }
  
    // Initialize FabricJS canvas.
    function setupFabricCanvas() {
      fabricCanvas = new fabric.Canvas(canvas, { backgroundColor: "#fff" });
      fabricCanvas.setWidth(800);
      fabricCanvas.setHeight(600);
      console.log("FabricJS canvas initialized.");
    }
  
    // Initialize graph state: create nodes and edges and add their corresponding FabricJS objects.
    function initializeGraph() {
      nodes = generateNodes(numCircles);
      edges = generateEdges(nodes);
      fabricCanvas.clear();
  
      // Create circles for each node.
      nodes.forEach(node => {
        const circle = new fabric.Circle({
          left: node.x,
          top: node.y,
          radius: 10,
          fill: "blue",
          originX: "center",
          originY: "center",
          selectable: false
        });
        node.circle = circle;
        fabricCanvas.add(circle);
      });
  
      // Create curves (Bezier paths) for each edge.
      edges.forEach(edge => {
        const { cx, cy } = calculateControlPoints(edge.from, edge.to, visualScale);
        const path = new fabric.Path(
          `M ${edge.from.x} ${edge.from.y} Q ${cx} ${cy} ${edge.to.x} ${edge.to.y}`,
          {
            stroke: "red",
            fill: "",
            selectable: false,
          }
        );
        edge.curve = path;
        fabricCanvas.add(path);
      });
      fabricCanvas.renderAll();
      console.log("Graph initialized with", nodes.length, "nodes and", edges.length, "edges.");
    }
  
    // Svelte lifecycle: on page mount, initialize the canvas and graph.
    onMount(() => {
      setupFabricCanvas();
      initializeGraph();
    });
  
    // Stop simulation when component is destroyed.
    onDestroy(() => {
      stopSimulation();
    });
  </script>
  
  <style>
    .controls {
      margin-bottom: 10px;
    }
    .controls label {
      margin-left: 10px;
    }
  </style>
  
  <div class="controls">
    <button on:click={startSimulation}>Start Optimization</button>
    <button on:click={stopSimulation}>Stop Optimization</button>
    <label>
      Visual Scale:
      <input type="range" min="0.1" max="5" step="0.1" bind:value={visualScale}
        on:input={() => {
          console.log("Visual scale updated:", visualScale);
        }}/>
    </label>
    <label>
      Number of Circles:
      <input type="range" min="5" max="50" step="1" bind:value={numCircles}
        on:change={() => {
          console.log("Number of circles updated:", numCircles);
          initializeGraph();
        }}/>
    </label>
    <label>
      Node Optimization (0: Fixed, 1: Optimize All):
      <input type="range" min="0" max="1" step="0.01" bind:value={optimizeNodes}
        on:input={() => {
          console.log("Node Optimization updated:", optimizeNodes);
        }}/>
    </label>
  </div>
  <canvas bind:this={canvas}></canvas>
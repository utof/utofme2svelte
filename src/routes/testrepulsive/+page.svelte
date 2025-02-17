<script>
    import { onMount, onDestroy } from 'svelte';
    import * as fabric from 'fabric';
  
    // Global variables to hold canvas, simulation data, and simulation state
    let canvas;
    let fabricCanvas;
    let nodes = [];
    let edges = [];
    let simulationInterval;
    let running = false;
    let visualScale = 1.0;
    let numCircles = 10; // default number of nodes
    
    // Function: generate nodes with random positions
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
  
    // Function: randomly connect nodes so that each node has 1 or 2 connections
    function generateEdges(nodes) {
      const list = [];
      const n = nodes.length;
      nodes.forEach((node) => {
        let connections = Math.floor(Math.random() * 2) + 1; // 1 or 2 connections
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
  
    // Function: Calculates control point for quadratic bezier using perpendicular bisector offset
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
  
    // Simulation update function: applies rudimentary repulsion, attraction, and updates FabricJS objects
    function updateSimulation() {
      const repulsionForce = 0.9;
      const attractionForce = 0.01;
      // Apply repulsion between every pair of nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = repulsionForce / (dist * dist);
          const fx = force * dx;
          const fy = force * dy;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
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
        edge.from.vx += fx;
        edge.from.vy += fy;
        edge.to.vx -= fx;
        edge.to.vy -= fy;
      });
      // Update positions and update FabricJS circles
      nodes.forEach(node => {
        node.vx *= 0.95; // Damping
        node.vy *= 0.95;
        node.x += node.vx;
        node.y += node.vy;
        // Simple boundary check (invert velocity if node goes out-of-bound)
        if (node.x < 0 || node.x > fabricCanvas.getWidth()) node.vx *= -1;
        if (node.y < 0 || node.y > fabricCanvas.getHeight()) node.vy *= -1;
        if (node.circle) {
          node.circle.set({ left: node.x, top: node.y });
        }
      });
      
      // Update curves (Bezier paths) for each edge
      edges.forEach(edge => {
        const { cx, cy } = calculateControlPoints(edge.from, edge.to, visualScale);
        if (edge.curve) {
          // Set a new quadratic bezier path that ensures endpoints meet node centers
          edge.curve.set({ path: [
            ["M", edge.from.x, edge.from.y],
            ["Q", cx, cy, edge.to.x, edge.to.y]
          ]});
        }
      });
      fabricCanvas.renderAll();
      console.log("Simulation step updated. Current positions:", nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
    }
  
    // Starts the simulation loop
    function startSimulation() {
      if (running) return;
      simulationInterval = setInterval(updateSimulation, 50);
      running = true;
      console.log("Simulation started.");
    }
  
    // Stops the simulation loop
    function stopSimulation() {
      clearInterval(simulationInterval);
      running = false;
      console.log("Simulation stopped.");
    }
  
    // Setup FabricJS canvas
    function setupFabricCanvas() {
      fabricCanvas = new fabric.Canvas(canvas, { backgroundColor: '#fff' });
      fabricCanvas.setWidth(800);
      fabricCanvas.setHeight(600);
      console.log("FabricJS canvas initialized.");
    }
  
    // Initialize graph: create new nodes and edges, then add FabricJS objects to canvas
    function initializeGraph() {
      nodes = generateNodes(numCircles);
      edges = generateEdges(nodes);
      fabricCanvas.clear();
      // Add circles for each node
      nodes.forEach(node => {
        const circle = new fabric.Circle({
          left: node.x,
          top: node.y,
          radius: 5,
          fill: 'blue',
          originX: 'center',
          originY: 'center',
          selectable: false
        });
        node.circle = circle;
        fabricCanvas.add(circle);
      });
      // Add curves for each edge
      edges.forEach(edge => {
        const { cx, cy } = calculateControlPoints(edge.from, edge.to, visualScale);
        const path = new fabric.Path(`M ${edge.from.x} ${edge.from.y} Q ${cx} ${cy} ${edge.to.x} ${edge.to.y}`, {
          stroke: 'red',
          fill: '',
          selectable: false,
        });
        edge.curve = path;
        fabricCanvas.add(path);
      });
      fabricCanvas.renderAll();
      console.log("Graph initialized with", nodes.length, "nodes and", edges.length, "edges.");
    }
  
    // Update UI control bindings
    let visualScaleInput = visualScale;
    let numCirclesInput = numCircles;
  
    onMount(() => {
      setupFabricCanvas();
      initializeGraph();
    });
  
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
      <input type="range" min="0.1" max="5" step="0.1" bind:value={visualScaleInput}
             on:input={() => { visualScale = parseFloat(visualScaleInput); console.log("Visual scale updated:", visualScale); }} />
    </label>
    <label>
      Number of Circles:
      <input type="range" min="5" max="50" step="1" bind:value={numCirclesInput}
             on:change={() => { 
               numCircles = parseInt(numCirclesInput);
               console.log("Number of circles updated:", numCircles);
               initializeGraph();
             }} />
    </label>
  </div>
  <canvas bind:this={canvas}></canvas>
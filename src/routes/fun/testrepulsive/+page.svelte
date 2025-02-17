<script>
    import { onMount } from 'svelte';
  
    let canvas;
    let context;
    let animationFrame;
    let nodes = [];
    let edges = [];
    let nodeCount = 10; // default value, but will be randomized on load
    let optimizationActive = false;
    let curveStyle = 'bezier'; // radio selection: 'bezier' or 'simple'
  
    // Initializes the graph with nodes and random edges.
    function initGraph() {
      nodes = [];
      edges = [];
      // Randomize the nodeCount on page load, between 2 and 50.
      nodeCount = Math.floor(Math.random() * (50 - 2 + 1)) + 2;
      console.log("Initializing graph with " + nodeCount + " nodes");
  
      // Create nodes with random positions.
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0
        });
      }
  
      // Create random edges between nodes with a chance of connection.
      // Here every pair has a chance of 20% to be connected.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.2) {
            edges.push({ source: i, target: j });
          }
        }
      }
      console.log("Edges generated: ", edges);
    }
  
    // Updates the simulation using a simple force-directed model.
    function updateSimulation() {
      if (!optimizationActive) return;
  
      const repulsion = 1000;
      const attraction = 0.1;
      const dt = 0.016; // time step
  
      // Apply repulsive forces between all pairs of nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          let distSq = dx * dx + dy * dy + 0.01; // avoid division by zero
          let force = repulsion / distSq;
          let angle = Math.atan2(dy, dx);
          nodes[i].vx -= force * Math.cos(angle) * dt;
          nodes[i].vy -= force * Math.sin(angle) * dt;
          nodes[j].vx += force * Math.cos(angle) * dt;
          nodes[j].vy += force * Math.sin(angle) * dt;
        }
      }
  
      // Apply attractive (spring-like) forces along edges.
      for (let e of edges) {
        let a = nodes[e.source];
        let b = nodes[e.target];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        // Spring force: proportional to current distance.
        let force = attraction * distance;
        let angle = Math.atan2(dy, dx);
        a.vx += force * Math.cos(angle) * dt;
        a.vy += force * Math.sin(angle) * dt;
        b.vx -= force * Math.cos(angle) * dt;
        b.vy -= force * Math.sin(angle) * dt;
      }
  
      // Update node positions and add damping.
      for (let node of nodes) {
        node.vx *= 0.95;
        node.vy *= 0.95;
        node.x += node.vx;
        node.y += node.vy;
        // Bounce off the canvas edges.
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -1;
          console.log("Node bounce x", node);
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -1;
          console.log("Node bounce y", node);
        }
      }
      console.log("Simulation updated");
      draw();
      animationFrame = requestAnimationFrame(updateSimulation);
    }
  
    // Draw the current state of the graph on the canvas.
    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw edges.
      context.lineWidth = 2;
      context.strokeStyle = "#888";
      for (let e of edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        context.beginPath();
        context.moveTo(a.x, a.y);
        if (curveStyle === 'bezier') {
          // Use a quadratic curve to create a smooth Bezier curve.
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          // Calculate a perpendicular offset.
          let normalX = -dy;
          let normalY = dx;
          const len = Math.sqrt(normalX * normalX + normalY * normalY) + 0.01;
          normalX /= len;
          normalY /= len;
          const curvature = 30; // factor to adjust curvature
          const cpX = midX + normalX * curvature;
          const cpY = midY + normalY * curvature;
          context.quadraticCurveTo(cpX, cpY, b.x, b.y);
        } else {
          // Draw a simple straight line.
          context.lineTo(b.x, b.y);
        }
        context.stroke();
      }
  
      // Draw nodes as circles.
      context.fillStyle = "#3498db";
      for (let node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, 8, 0, Math.PI * 2);
        context.fill();
      }
      console.log("Canvas rendered");
    }
  
    // Start the optimization simulation.
    function startOptimization() {
      if (!optimizationActive) {
        optimizationActive = true;
        console.log("Starting optimization");
        updateSimulation();
      }
    }
  
    // Stop the simulation.
    function stopOptimization() {
      optimizationActive = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      console.log("Stopping optimization");
    }
  
    // Reset the graph (stop simulation, reinitialize graph, and redraw).
    function resetGraph() {
      stopOptimization();
      initGraph();
      draw();
    }
  
    // Handle changes from the node count slider.
    function handleSliderChange(e) {
      nodeCount = parseInt(e.target.value);
      console.log("Slider changed, node count:", nodeCount);
      // Regenerate the nodes based on the new node count.
      stopOptimization();
      nodes = [];
      edges = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0
        });
      }
      // Re-generate random edges.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.2) {
            edges.push({ source: i, target: j });
          }
        }
      }
      draw();
    }
  
    onMount(() => {
      canvas = document.getElementById('graphCanvas');
      context = canvas.getContext('2d');
      // Set canvas dimensions.
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 100;
      initGraph();
      draw();
      console.log("Svelte page loaded: Graph visualization ready");
    });
  </script>
  
  <style>
    canvas {
      border: 1px solid #ccc;
      display: block;
      margin: 0 auto;
    }
    .controls {
      margin: 10px;
      text-align: center;
    }
    .controls label {
      margin-right: 10px;
    }
  </style>
  
  <canvas id="graphCanvas"></canvas>
  
  <div class="controls">
    <button on:click={startOptimization}>Start Optimization</button>
    <button on:click={stopOptimization}>Stop Optimization</button>
    <button on:click={resetGraph}>Reset Graph</button>
  </div>
  
  <div class="controls">
    <label for="nodeSlider">Number of Nodes (2-50): </label>
    <input type="range" id="nodeSlider" min="2" max="50" value={nodeCount} on:change={handleSliderChange} />
    <span>{nodeCount}</span>
  </div>
  
  <div class="controls">
    <label>Curve Style:</label>
    <label>
      <input type="radio" name="curveStyle" value="bezier" bind:group={curveStyle} />
      Bezier
    </label>
    <label>
      <input type="radio" name="curveStyle" value="simple" bind:group={curveStyle} />
      Simple
    </label>
  </div>
  
  <p style="text-align: center; font-weight: bold;">
    Next Steps: After this implementation, should we proceed with adding a slider to control the degree of bezierness (from 0 for straight lines to 1 for nonlinear Bezier curves) and further interactivity (like adding, removing, and dragging nodes and curves)? Please confirm.
  </p>
<!-- kinda_works_but_curvesweird -->
<script>
    import { onMount } from 'svelte';
  
    let canvas;
    let context;
    let animationFrame;
    let nodes = [];
    let edges = [];
    let nodeCount = 10; // default value, will be randomized on load
    let optimizationActive = false;
    let curveStyle = 'bezier'; // radio selection: 'bezier' or 'simple'
  
    // Simulation parameters: increased values for stronger displacement and scaling adjustments.
    let repulsionConstant = 10000; // increased from 1000 to a larger value for a stronger repulsive force.
    let attractionConstant = 0.1; // spring-like force along edges remains the same.
    let dampingFactor = 0.9; // slightly altered damping factor.
    let dt = 0.016; // time step remains the same
    const collisionThreshold = 20; // minimum distance to trigger collision repulsion between nodes
    
    // Step 1: Initialize the graph with nodes and random edges.
    function initGraph() {
      nodes = [];
      edges = [];
      // Randomize the node count on page load between 2 and 50.
      nodeCount = Math.floor(Math.random() * (50 - 2 + 1)) + 2;
      console.log("Initializing graph with " + nodeCount + " nodes");
  
      // Create nodes with random positions across a larger area.
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0
        });
      }
  
      // Create random edges between nodes (20% chance for each pair).
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.2) {
            edges.push({ source: i, target: j });
          }
        }
      }
      console.log("Edges generated: ", edges);
    }
  
    // Step 2: Update the simulation with enhanced force-directed model and collision handling.
    function updateSimulation() {
      if (!optimizationActive) return;
  
      // --- Node Repulsion (enhanced) ---
      // Apply stronger repulsive forces between all pairs of nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          let distSq = dx * dx + dy * dy + 0.01; // avoid division by zero
          let force = repulsionConstant / distSq;
          let angle = Math.atan2(dy, dx);
          nodes[i].vx -= force * Math.cos(angle) * dt;
          nodes[i].vy -= force * Math.sin(angle) * dt;
          nodes[j].vx += force * Math.cos(angle) * dt;
          nodes[j].vy += force * Math.sin(angle) * dt;
        }
      }
  
      // --- Additional Collision Detection ---
      // If nodes are too close, apply a strong separation force.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          let distance = Math.sqrt(dx * dx + dy * dy) + 0.01;
          if (distance < collisionThreshold) {
            let pushForce = (collisionThreshold - distance) * 50; // multiplication factor for strong push
            let angle = Math.atan2(dy, dx);
            nodes[i].vx -= pushForce * Math.cos(angle) * dt;
            nodes[i].vy -= pushForce * Math.sin(angle) * dt;
            nodes[j].vx += pushForce * Math.cos(angle) * dt;
            nodes[j].vy += pushForce * Math.sin(angle) * dt;
            console.log("Collision avoidance applied between nodes", i, j);
          }
        }
      }
  
      // --- Attractive Force along Edges ---
      for (let e of edges) {
        let a = nodes[e.source];
        let b = nodes[e.target];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        // Spring force proportional to the distance.
        let force = attractionConstant * distance;
        let angle = Math.atan2(dy, dx);
        a.vx += force * Math.cos(angle) * dt;
        a.vy += force * Math.sin(angle) * dt;
        b.vx -= force * Math.cos(angle) * dt;
        b.vy -= force * Math.sin(angle) * dt;
      }
  
      // --- Update Node Positions with Damping and Boundary Checks ---
      for (let node of nodes) {
        node.vx *= dampingFactor;
        node.vy *= dampingFactor;
        node.x += node.vx;
        node.y += node.vy;
  
        // Bounce off canvas boundaries.
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
  
    // Step 3: Draw the updated graph states on the canvas.
    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw edges connecting nodes.
      context.lineWidth = 2;
      context.strokeStyle = "#888";
      for (let e of edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        context.beginPath();
        context.moveTo(a.x, a.y);
        if (curveStyle === 'bezier') {
          // Use a quadratic Bezier curve with dynamic adjustment.
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
          // Increase curvature based on canvas scale.
          const curvature = Math.min(canvas.width, canvas.height) / 20; // dynamically scale curvature
          const cpX = midX + normalX * curvature;
          const cpY = midY + normalY * curvature;
          context.quadraticCurveTo(cpX, cpY, b.x, b.y);
        } else {
          // Draw a simple straight line if selected.
          context.lineTo(b.x, b.y);
        }
        context.stroke();
      }
  
      // Draw nodes as circles.
      context.fillStyle = "#3498db";
      for (let node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, 10, 0, Math.PI * 2); // increased radius for better visibility
        context.fill();
      }
      console.log("Canvas rendered");
    }
  
    // Step 4: Start the simulation optimization.
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
  
    // Reset the graph by reinitializing and drawing.
    function resetGraph() {
      stopOptimization();
      initGraph();
      draw();
    }
  
    // Handle changes from the node count slider.
    function handleSliderChange(e) {
      nodeCount = parseInt(e.target.value);
      console.log("Slider changed, node count:", nodeCount);
      // Regenerate nodes and edges based on new slider value.
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
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.2) {
            edges.push({ source: i, target: j });
          }
        }
      }
      draw();
    }
  
    // onMount lifecycle: Set up the canvas and initialize the graph.
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
    Next Steps: After this implementation, should we proceed with adding a slider to control the degree of bezierness (from 0 for straight lines to 1 for non-linear Bezier curves) and further interactivity (like adding, removing, and dragging nodes and curves)? Please confirm.
  </p>
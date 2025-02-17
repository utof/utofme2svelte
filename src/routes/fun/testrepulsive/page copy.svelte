<script lang="js">
    import { onMount, onDestroy } from 'svelte';
  
    // Simulation parameters
    const dt = 0.1;            // Time step for Euler integration.
    const friction = 0.9;      // Damping factor.
    
    // Base force parameters.
    const kEdge = 0.2;         // Spring constant for edge forces (increased).
    const repulsionStrength = 2000;  // Base repulsion strength (increased).
    const repulsionThreshold = 100;  // Trigger repulsive forces when nodes are closer than this.
    
    // Overall strength multiplier for all forces.
    let overallStrength = 10;
    
    // Default number of nodes (between 2 and 50 as per UI slider).
    let numberOfNodes = 10;
    
    // Data structures for nodes and edges.
    // Node structure: { id, x, y, vx, vy }
    let nodes = [];
    // Edge structure: { from, to, restLength, curvature }
    // We now update curvature each frame as a measure of tension.
    let edges = [];
    
    let canvas;
    let ctx;
    let animationFrameId = null;
    let optimizing = false;
    
    // Generate a random graph.
    function generateGraph() {
      stopOptimization();
      nodes = [];
      edges = [];
    
      const width = canvas.width;
      const height = canvas.height;
    
      // Create nodes at random positions.
      for (let i = 0; i < numberOfNodes; i++) {
        nodes.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0
        });
      }
    
      // Create random edges between unique node pairs (probability 0.3).
      for (let i = 0; i < numberOfNodes; i++) {
        for (let j = i + 1; j < numberOfNodes; j++) {
          if (Math.random() < 0.3) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const d = Math.hypot(dx, dy);
            // Initially, the rest length is the current distance.
            edges.push({
              from: i,
              to: j,
              restLength: d,
              curvature: 0 // will be updated dynamically.
            });
          }
        }
      }
    }
    
    // Update forces and positions.
    function simulate() {
      // Initialize force accumulators.
      const forces = nodes.map(() => ({ fx: 0, fy: 0 }));
    
      // Calculate spring forces along edges.
      edges.forEach(edge => {
        const n1 = nodes[edge.from];
        const n2 = nodes[edge.to];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d = Math.hypot(dx, dy) || 0.001;
    
        // Spring force based on Hooke's law scaled by overallStrength.
        const forceMag = overallStrength * kEdge * (d - edge.restLength);
        const fx = forceMag * (dx / d);
        const fy = forceMag * (dy / d);
    
        forces[edge.from].fx += fx;
        forces[edge.from].fy += fy;
        forces[edge.to].fx -= fx;
        forces[edge.to].fy -= fy;
    
        // Update dynamic curvature: proportional to edge tension.
        // If the edge is stretched (d > restLength), we add a positive curvature.
        // If compressed, we add a negative curvature.
        edge.curvature = 50 * overallStrength * (d - edge.restLength) / edge.restLength;
      });
    
      // Calculate repulsive forces for each node pair.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < repulsionThreshold) {
            let repForce = overallStrength * repulsionStrength / (d * d);
            repForce = Math.min(repForce, 100); // Clamp force to avoid overshooting.
            const fx = repForce * (dx / d);
            const fy = repForce * (dy / d);
            forces[i].fx -= fx;
            forces[i].fy -= fy;
            forces[j].fx += fx;
            forces[j].fy += fy;
          }
        }
      }
    
      // Update positions using simple Euler integration.
      nodes.forEach((node, i) => {
        node.vx = (node.vx + forces[i].fx * dt) * friction;
        node.vy = (node.vy + forces[i].fy * dt) * friction;
        node.x += node.vx * dt;
        node.y += node.vy * dt;
    
        // Bounce nodes off the canvas boundaries.
        if (node.x < 0) { node.x = 0; node.vx *= -0.5; }
        if (node.y < 0) { node.y = 0; node.vy *= -0.5; }
        if (node.x > canvas.width) { node.x = canvas.width; node.vx *= -0.5; }
        if (node.y > canvas.height) { node.y = canvas.height; node.vy *= -0.5; }
      });
    }
    
    // Render function to draw nodes and curved edges.
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Draw edges as quadratic Bézier curves.
      edges.forEach(edge => {
        const n1 = nodes[edge.from];
        const n2 = nodes[edge.to];
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
    
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d = Math.hypot(dx, dy) || 1;
        // Compute perpendicular vector.
        const perpX = -dy / d;
        const perpY = dx / d;
    
        // The control point is offset by the dynamically computed curvature.
        const controlX = midX + perpX * edge.curvature;
        const controlY = midY + perpY * edge.curvature;
    
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.quadraticCurveTo(controlX, controlY, n2.x, n2.y);
        ctx.strokeStyle = '#aaa';
        ctx.stroke();
      });
    
      // Draw nodes as filled circles.
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
      });
    }
    
    // Animation loop.
    function animate() {
      if (optimizing) {
        simulate();
        render();
        animationFrameId = requestAnimationFrame(animate);
      }
    }
    
    function startOptimization() {
      if (!optimizing) {
        optimizing = true;
        animationFrameId = requestAnimationFrame(animate);
      }
    }
    
    function stopOptimization() {
      optimizing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    
    function resetGraph() {
      generateGraph();
      render();
    }
    
    onMount(() => {
      canvas = document.getElementById('graph-canvas');
      ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = 600;
      generateGraph();
      render();
    
      const resizeHandler = () => {
        canvas.width = window.innerWidth;
        canvas.height = 600;
        render();
      };
      window.addEventListener('resize', resizeHandler);
    
      onDestroy(() => {
        window.removeEventListener('resize', resizeHandler);
        stopOptimization();
      });
    });
  </script>
    
  <style>
    .controls {
      margin: 10px;
    }
    .controls > * {
      margin-right: 10px;
    }
    canvas {
      border: 1px solid #ccc;
      display: block;
      margin: auto;
    }
  </style>
    
  <div class="controls">
    <button on:click={startOptimization}>Start Optimization</button>
    <button on:click={stopOptimization}>Stop Optimization</button>
    <button on:click={resetGraph}>Reset Graph</button>
    <label>
      Number of Nodes:
      <input type="range" min="2" max="50" bind:value={numberOfNodes} on:change={resetGraph} />
      {numberOfNodes}
    </label>
    <label>
      Overall Strength:
      <input type="range" min="1" max="20" bind:value={overallStrength} on:change={resetGraph} />
      {overallStrength}
    </label>
  </div>
    
  <canvas id="graph-canvas"></canvas>
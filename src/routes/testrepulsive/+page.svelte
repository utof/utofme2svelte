<script>
    import { onMount, onDestroy } from "svelte";
  
    // Canvas dimensions
    const width = 800;
    const height = 600;
  
    let canvas, ctx;
    let nodes = [];
    let edges = [];
    let running = false;
    let simAnimationFrame;
  
    // UI parameters
    let visualScale = 1.0;   // Controls curve shaping
    let numCircles = 10;     // Number of nodes
    let optimizeNodes = 1.0; // 0: fixed nodes, 1: optimize nodes and curves
  
    // Generate nodes with random positions
    function generateNodes(n) {
      const list = [];
      for (let i = 0; i < n; i++) {
        list.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0
        });
      }
      console.log("Generated nodes:", list);
      return list;
    }
  
    // Randomly connect nodes (each node gets 1 or 2 edges)
    function generateEdges(nodes) {
      const list = [];
      const n = nodes.length;
      nodes.forEach((node) => {
        const connections = Math.floor(Math.random() * 2) + 1; // 1 or 2 connections
        for (let j = 0; j < connections; j++) {
          const target = nodes[Math.floor(Math.random() * n)];
          if (target.id !== node.id) {
            list.push({ from: node, to: target });
          }
        }
      });
      console.log("Generated edges:", list);
      return list;
    }
  
    // Calculate the control point for a quadratic Bézier curve using the perpendicular bisector offset
    function calculateControlPoints(from, to, scale) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const offset = 0.3 * scale * len;
      const cx = midX - offset * (dy / len);
      const cy = midY + offset * (dx / len);
      return { cx, cy };
    }
  
    // Compute the midpoint of a quadratic Bézier curve at t = 0.5 for energy calculations
    function bezierMidpoint(from, control, to) {
      return {
        x: (from.x + 2 * control.cx + to.x) / 4,
        y: (from.y + 2 * control.cy + to.y) / 4
      };
    }
  
    // Apply an extra repulsive force when the midpoints of two curves get too close
    function applyIntersectionEnergy() {
      const intersectionThreshold = 30; // in pixels
      const intersectionForceFactor = 0.05;
      for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
          const edge1 = edges[i];
          const edge2 = edges[j];
          // Skip if the edges share a node
          if (
            edge1.from.id === edge2.from.id ||
            edge1.from.id === edge2.to.id ||
            edge1.to.id === edge2.from.id ||
            edge1.to.id === edge2.to.id
          ) {
            continue;
          }
          // Get control points and then the midpoints of the curves
          const cp1 = calculateControlPoints(edge1.from, edge1.to, visualScale);
          const cp2 = calculateControlPoints(edge2.from, edge2.to, visualScale);
          const mid1 = bezierMidpoint(edge1.from, cp1, edge1.to);
          const mid2 = bezierMidpoint(edge2.from, cp2, edge2.to);
          const dx = mid2.x - mid1.x;
          const dy = mid2.y - mid1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < intersectionThreshold) {
            console.log("Intersection energy triggered between edges", edge1, edge2);
            const force = intersectionForceFactor * (intersectionThreshold - dist);
            const fx = (force * dx) / (dist + 0.1);
            const fy = (force * dy) / (dist + 0.1);
            // Distribute the force between the four nodes
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
  
    // Update simulation physics: repulsion, attraction, and node movement
    function updateSimulation() {
      const repulsionForce = 0.5;
      const attractionForce = 0.01;
  
      // Only update node positions if optimizeNodes > 0 (otherwise, nodes remain fixed)
      if (optimizeNodes > 0) {
        // Apply repulsion between node pairs
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
        // Apply attraction along each edge
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
  
        // Update node positions using damping, and bounce at boundaries
        nodes.forEach(node => {
          node.vx *= 0.95;
          node.vy *= 0.95;
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        });
      }
  
      // Apply forces to minimize overlapping of Bézier curves
      applyIntersectionEnergy();
      console.log("Simulation updated. Node positions:", nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
    }
  
    // Draw the simulation state on the canvas
    function draw() {
      ctx.clearRect(0, 0, width, height);
      // Draw edges as quadratic Bézier curves
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      edges.forEach(edge => {
        const cp = calculateControlPoints(edge.from, edge.to, visualScale);
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.quadraticCurveTo(cp.cx, cp.cy, edge.to.x, edge.to.y);
        ctx.stroke();
      });
      // Draw nodes as blue circles
      ctx.fillStyle = "blue";
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  
    // Main simulation loop using requestAnimationFrame
    function simulationLoop() {
      if (!running) return;
      updateSimulation();
      draw();
      if (typeof window !== "undefined") {
        simAnimationFrame = window.requestAnimationFrame(simulationLoop);
      }
    }
  
    // Start the simulation loop (only runs in the browser)
    function startSimulation() {
      if (running) return;
      running = true;
      console.log("Simulation started.");
      simulationLoop();
    }
  
    // Stop the simulation loop (only runs in the browser)
    function stopSimulation() {
      running = false;
      if (typeof window !== "undefined" && simAnimationFrame) {
        window.cancelAnimationFrame(simAnimationFrame);
      }
      console.log("Simulation stopped.");
    }
  
    // Initialize graph: create nodes, edges, and perform an initial draw
    function initializeGraph() {
      nodes = generateNodes(numCircles);
      edges = generateEdges(nodes);
      console.log("Graph initialized with", nodes.length, "nodes and", edges.length, "edges.");
      draw();
    }
  
    onMount(() => {
      canvas = document.getElementById("simCanvas");
      if (canvas) {
        ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        initializeGraph();
      }
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
      margin: 0 10px;
    }
  </style>
  
  <div class="controls">
    <button on:click={startSimulation}>Start Optimization</button>
    <button on:click={stopSimulation}>Stop Optimization</button>
    <label>
      Visual Scale:
      <input type="range" min="0.1" max="5" step="0.1" bind:value={visualScale} on:input={() => console.log("Visual Scale:", visualScale)} />
    </label>
    <label>
      Number of Circles:
      <input type="range" min="5" max="50" step="1" bind:value={numCircles} on:change={() => { console.log("Nodes updated:", numCircles); initializeGraph(); }} />
    </label>
    <label>
      Node Optimization (0 fixed, 1 optimize all):
      <input type="range" min="0" max="1" step="0.01" bind:value={optimizeNodes} on:input={() => console.log("Optimize Nodes:", optimizeNodes)} />
    </label>
  </div>
  <canvas id="simCanvas"></canvas>
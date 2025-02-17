<script>
    import { onMount } from "svelte";
  
    // --- Utility Classes and Functions for Curve Handling ---
    class ControlPoint {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    }
  
    // The Curve class encapsulates an arbitrary-point Bezier curve.
    class Curve {
      constructor(controlPoints) {
        this.controlPoints = controlPoints; // Array of ControlPoint objects
      }
  
      bernsteinPolynomial(i, n, t) {
        let binCoeff = 1.0;
        for (let j = 0; j < i; j++) {
          binCoeff *= (n - j) / (j + 1);
        }
        return binCoeff * Math.pow(t, i) * Math.pow(1 - t, n - i);
      }
  
      // Evaluate the curve at parameter t in [0,1]
      evaluate(t) {
        let result = new ControlPoint(0, 0);
        const n = this.controlPoints.length - 1;
        for (let i = 0; i <= n; i++) {
          let b = this.bernsteinPolynomial(i, n, t);
          result.x += b * this.controlPoints[i].x;
          result.y += b * this.controlPoints[i].y;
        }
        return result;
      }
  
      derivative(t) {
        let result = new ControlPoint(0, 0);
        const n = this.controlPoints.length - 1;
        for (let i = 0; i < n; i++) {
          let b = this.bernsteinPolynomial(i, n - 1, t);
          result.x += n * b * (this.controlPoints[i + 1].x - this.controlPoints[i].x);
          result.y += n * b * (this.controlPoints[i + 1].y - this.controlPoints[i].y);
        }
        return result;
      }
    }
  
    // Intersection detection functions using sampling.
    function distanceSquared(p1, p2) {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return dx * dx + dy * dy;
    }
  
    // Returns true if curves intersect based on sampling, using fewer sample points for performance.
    function curvesIntersect(curve1, curve2) {
      const samplePoints = 20; // Reduced sample points for performance
      for (let i = 0; i < samplePoints; i++) {
        const t1 = i / (samplePoints - 1);
        const p1 = curve1.evaluate(t1);
        for (let j = 0; j < samplePoints; j++) {
          const t2 = j / (samplePoints - 1);
          const p2 = curve2.evaluate(t2);
          if (distanceSquared(p1, p2) < 1e-4) {
            return true;
          }
        }
      }
      return false;
    }
  
    // --- Simulation and Visualization Code ---
    let canvas;
    let ctx;
    let animationId;
    let simulationStarted = false;
  
    const width = 800;
    const height = 600;
  
    let globalTime = 0;
    const dt = 0.1;
  
    // Simulation parameters for node forces
    const repulsionStrength = 500;
    const attractionStrength = 0.05;
    const damping = 0.9;
    const minDist = 30;
    const idealDistance = 70;
  
    // For collisions, instead of a huge impulse, we add a small repulsive adjustment.
    const collisionRepulsion = 0.1;
  
    // Data structures: nodes and connections.
    let numNodes = 10; // default value controllable via slider
    let nodes = []; // each node: { id, x, y, vx, vy }
    let connections = []; // each connection: { a, b, cp1Offset, cp2Offset, phase }
  
    // Generate a fully random graph.
    // Ensure no duplicate links between nodes (unordered pair uniqueness).
    function generateGraph() {
      console.clear();
      nodes = [];
      connections = [];
      const existingLinks = new Set();
  
      // Create nodes with random positions and zero velocity.
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0
        });
      }
  
      // For each node, attempt to add two random connections.
      for (let i = 0; i < numNodes; i++) {
        const targets = [];
        while (targets.length < 2) {
          const target = Math.floor(Math.random() * numNodes);
          if (target !== i) {
            const key = i < target ? `${i}-${target}` : `${target}-${i}`;
            if (!existingLinks.has(key)) {
              existingLinks.add(key);
              targets.push(target);
              connections.push({
                a: i,
                b: target,
                // Random offsets for control points to generate arbitrary curves.
                cp1Offset: { x: (Math.random() * 40) - 20, y: (Math.random() * 40) - 20 },
                cp2Offset: { x: (Math.random() * 40) - 20, y: (Math.random() * 40) - 20 },
                phase: Math.random() * Math.PI * 2
              });
            }
          }
        }
      }
      console.log("Graph generated:", { nodes, connections });
    }
  
    // Compute the control points for a connection.
    // Returns an array of four ControlPoint objects for a cubic Bezier.
    function computeControlPoints(connection) {
      const n1 = nodes[connection.a];
      const n2 = nodes[connection.b];
  
      // Start and end points.
      const start = new ControlPoint(n1.x, n1.y);
      const end = new ControlPoint(n2.x, n2.y);
  
      // Vector from start to end.
      const dx = end.x - start.x;
      const dy = end.y - start.y;
  
      // Base control points along the line.
      const cp1Base = new ControlPoint(start.x + 0.3 * dx, start.y + 0.3 * dy);
      const cp2Base = new ControlPoint(start.x + 0.7 * dx, start.y + 0.7 * dy);
  
      // Oscillation to alter curvature over time.
      const oscillation = Math.sin(globalTime + connection.phase);
  
      // Adjust control points with arbitrary offsets.
      const cp1 = new ControlPoint(
        cp1Base.x + connection.cp1Offset.x * oscillation,
        cp1Base.y + connection.cp1Offset.y * oscillation
      );
      const cp2 = new ControlPoint(
        cp2Base.x + connection.cp2Offset.x * oscillation,
        cp2Base.y + connection.cp2Offset.y * oscillation
      );
      return [start, cp1, cp2, end];
    }
  
    // Update simulation: update node positions with repulsion and attraction.
    function updateSimulation() {
      globalTime += dt;
  
      // Repulsive forces among all nodes.
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        let fx = 0, fy = 0;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.01;
            const repulse = repulsionStrength / distSq;
            fx += (dx / dist) * repulse;
            fy += (dy / dist) * repulse;
          }
        }
        n1.vx = (n1.vx + fx * dt) * damping;
        n1.vy = (n1.vy + fy * dt) * damping;
      }
  
      // Attractive forces along connections using Hookean force.
      connections.forEach(conn => {
        const n1 = nodes[conn.a];
        const n2 = nodes[conn.b];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (d - idealDistance) * attractionStrength;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        n1.vx += fx * dt;
        n1.vy += fy * dt;
        n2.vx -= fx * dt;
        n2.vy -= fy * dt;
      });
  
      // Update positions and enforce boundaries.
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) {
          node.vx *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
        }
        if (node.y < 0 || node.y > height) {
          node.vy *= -1;
          node.y = Math.max(0, Math.min(height, node.y));
        }
      });
    }
  
    // Check for collisions between curves.
    // Instead of a huge impulse, we add a small extra repulsion between nodes whose curves
    // are intersecting. This nudges them apart over subsequent simulation frames.
    function checkCurveCollisions() {
      for (let i = 0; i < connections.length; i++) {
        for (let j = i + 1; j < connections.length; j++) {
          const cp1 = computeControlPoints(connections[i]);
          const cp2 = computeControlPoints(connections[j]);
          const curve1 = new Curve(cp1);
          const curve2 = new Curve(cp2);
          if (curvesIntersect(curve1, curve2)) {
            // Compute approximate midpoints of each curve.
            const mid1 = new ControlPoint((cp1[0].x + cp1[3].x) / 2, (cp1[0].y + cp1[3].y) / 2);
            const mid2 = new ControlPoint((cp2[0].x + cp2[3].x) / 2, (cp2[0].y + cp2[3].y) / 2);
            const dx = mid1.x - mid2.x;
            const dy = mid1.y - mid2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
            // Calculate a small repulsive force.
            const repulseX = (dx / dist) * collisionRepulsion;
            const repulseY = (dy / dist) * collisionRepulsion;
            // Apply small adjustments to all nodes involved in both connections.
            [connections[i].a, connections[i].b, connections[j].a, connections[j].b].forEach(idx => {
              nodes[idx].vx += repulseX;
              nodes[idx].vy += repulseY;
            });
          }
        }
      }
    }
  
    // Draw function: render curves and nodes.
    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
  
      // Draw curves.
      connections.forEach(conn => {
        const cp = computeControlPoints(conn);
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(cp[0].x, cp[0].y);
        ctx.bezierCurveTo(cp[1].x, cp[1].y, cp[2].x, cp[2].y, cp[3].x, cp[3].y);
        ctx.stroke();
      });
  
      // Draw nodes.
      nodes.forEach(node => {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  
    // Main simulation loop.
    function step() {
      updateSimulation();
      checkCurveCollisions();
      draw();
      // Reduce logging frequency to avoid performance hit.
      animationId = requestAnimationFrame(step);
    }
  
    function startSimulation() {
      if (!simulationStarted) {
        simulationStarted = true;
        step();
      }
    }
  
    function stopSimulation() {
      simulationStarted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }
  
    onMount(() => {
      ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      generateGraph();
    });
  </script>
  
  <style>
    canvas {
      border: 1px solid #ccc;
      display: block;
      margin: 10px 0;
    }
    .controls {
      margin: 10px 0;
    }
  </style>
  
  <canvas bind:this={canvas}></canvas>
  <div class="controls">
    <button on:click={startSimulation}>Start Optimization</button>
    <button on:click={stopSimulation}>Stop Optimization</button>
    <br />
    <label for="node-slider">Number of Nodes: {numNodes}</label>
    <input
      id="node-slider"
      type="range"
      min="2"
      max="50"
      bind:value={numNodes}
      on:input={() => {
        generateGraph();
      }}
    />
  </div>

<script>
    import { onMount } from 'svelte';
  
    let canvas;
    let ctx;
    let width = 800;
    let height = 600;
    
    // Simulation state
    let nodes = [];
    let curves = [];
    let optimizing = false;
    let lastTime = performance.now();
    let simulationTime = 0;
  
    // UI Settings / Parameters
    // Number of Circles slider: range 2 to 50.
    let numNodes = 10;
    
    // Wild slider ranges for node repulsion parameters.
    let nodeRepulsionStrength = 1000;  // Range from 0 to 100000.
    let nodeThreshold = 150;           // Range from 10 to 500.
    let dampingFactor = 0.9;           // Range from 0.5 to 1.
  
    // Parameters for curve repulsion.
    let curveRepulsionThreshold = 50;  // Range from 10 to 200.
    let curveRepulsionStrength = 0.1;  // Range from 0 to 2.
  
    // Offset scale factor slider.
    let offsetScale = 1;               // Range from 0 to 5.
  
    // Snake-like oscillation factor to get undulating, snake-like curves.
    let snakeFrequency = 0;            // (Oscillation frequency)
    let snakeAmplitude = 20;           // (Maximum additional offset)
  
    // Node class
    class Node {
      constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
      }
      applyForce(fx, fy) {
        this.dx += fx;
        this.dy += fy;
      }
      update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.dx *= dampingFactor;
        this.dy *= dampingFactor;
      }
    }
  
    // Curve class representing a bezier curve connecting two nodes.
    class Curve {
      constructor(nodeA, nodeB) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.cp1 = { x: 0, y: 0 };
        this.cp2 = { x: 0, y: 0 };
        this.repulsionOffset = { x: 0, y: 0 };
      }
      
      updateControlPoints() {
        let dx = this.nodeB.x - this.nodeA.x;
        let dy = this.nodeB.y - this.nodeA.y;
        let length = Math.sqrt(dx * dx + dy * dy) || 1;
        // Base perpendicular offset scaled by offsetScale.
        let baseOffset = length * offsetScale * 0.1;
        let perpX = -dy / length * baseOffset;
        let perpY = dx / length * baseOffset;
  
        // Add snake-like oscillations.
        // Compute an oscillating factor using simulationTime and average position.
        let avgPos = (this.nodeA.x + this.nodeA.y + this.nodeB.x + this.nodeB.y) / 4;
        let oscillation = Math.sin(simulationTime * snakeFrequency + avgPos) * snakeAmplitude;
        let snakeOffsetX = -dy / length * oscillation;
        let snakeOffsetY = dx / length * oscillation;
        
        // Control points mixing base perpendicular offset, snake oscillation and repulsion offset.
        this.cp1.x = this.nodeA.x + dx / 3 + perpX + snakeOffsetX + this.repulsionOffset.x * offsetScale;
        this.cp1.y = this.nodeA.y + dy / 3 + perpY + snakeOffsetY + this.repulsionOffset.y * offsetScale;
        this.cp2.x = this.nodeA.x + (2 * dx) / 3 + perpX + snakeOffsetX + this.repulsionOffset.x * offsetScale;
        this.cp2.y = this.nodeA.y + (2 * dy) / 3 + perpY + snakeOffsetY + this.repulsionOffset.y * offsetScale;
      }
    }
  
    // Create a random graph with random node positions and connections.
    function createRandomGraph() {
      nodes = [];
      curves = [];
      for (let i = 0; i < numNodes; i++) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        nodes.push(new Node(i, x, y));
      }
      // Connect each node to its immediate neighbor and one random connection.
      for (let i = 0; i < nodes.length; i++) {
        let next = nodes[(i + 1) % nodes.length];
        curves.push(new Curve(nodes[i], next));
        let randomIndex = Math.floor(Math.random() * nodes.length);
        if (randomIndex !== i) {
          curves.push(new Curve(nodes[i], nodes[randomIndex]));
        }
      }
      console.log("Created random graph", { nodes, curves });
    }
  
    // Node repulsion: apply repulsion forces among nodes.
    function updateNodeRepulsion() {
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          let other = nodes[j];
          let dx = node.x - other.x;
          let dy = node.y - other.y;
          let distSq = dx * dx + dy * dy;
          let distance = Math.sqrt(distSq) || 1;
          if (distance < nodeThreshold) {
            let force = nodeRepulsionStrength / distSq;
            let fx = (dx / distance) * force;
            let fy = (dy / distance) * force;
            node.applyForce(fx, fy);
          }
        }
      }
    }
  
    // Curve repulsion: compute repulsion offsets between curves.
    function updateCurveRepulsion() {
      // Reset repulsion offsets.
      curves.forEach(curve => {
        curve.repulsionOffset = { x: 0, y: 0 };
      });
      for (let i = 0; i < curves.length; i++) {
        let curve1 = curves[i];
        let mid1 = { 
          x: (curve1.nodeA.x + curve1.nodeB.x) / 2, 
          y: (curve1.nodeA.y + curve1.nodeB.y) / 2 
        };
        for (let j = i + 1; j < curves.length; j++) {
          let curve2 = curves[j];
          let mid2 = {
            x: (curve2.nodeA.x + curve2.nodeB.x) / 2, 
            y: (curve2.nodeA.y + curve2.nodeB.y) / 2 
          };
          let dx = mid1.x - mid2.x;
          let dy = mid1.y - mid2.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < curveRepulsionThreshold) {
            let repulsionForce = curveRepulsionStrength * (curveRepulsionThreshold - dist) / dist;
            curve1.repulsionOffset.x += (dx / dist) * repulsionForce;
            curve1.repulsionOffset.y += (dy / dist) * repulsionForce;
            curve2.repulsionOffset.x -= (dx / dist) * repulsionForce;
            curve2.repulsionOffset.y -= (dy / dist) * repulsionForce;
          }
        }
      }
    }
  
    // Simulation update: update node forces, positions and curve control points.
    function updateSimulation(dt) {
      simulationTime += dt;
      updateNodeRepulsion();
      
      nodes.forEach(node => {
        node.update(dt);
        // Simple boundary check: reverse velocity if out of bounds.
        if (node.x < 0 || node.x > width) node.dx = -node.dx;
        if (node.y < 0 || node.y > height) node.dy = -node.dy;
      });
      
      // Update control points for curves.
      curves.forEach(curve => {
        curve.updateControlPoints();
      });
      
      updateCurveRepulsion();
      curves.forEach(curve => {
        curve.updateControlPoints();
      });
    }
  
    // Drawing the simulation.
    function draw() {
      ctx.clearRect(0, 0, width, height);
      // Draw Bezier curves.
      curves.forEach(curve => {
        ctx.beginPath();
        ctx.moveTo(curve.nodeA.x, curve.nodeA.y);
        ctx.bezierCurveTo(curve.cp1.x, curve.cp1.y, curve.cp2.x, curve.cp2.y, curve.nodeB.x, curve.nodeB.y);
        ctx.strokeStyle = "rgba(0,0,255,0.5)";
        ctx.stroke();
      });
      // Draw nodes as red circles.
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
      });
    }
  
    // Main animation loop.
    function animationLoop(timestamp) {
      if (!optimizing) return;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      updateSimulation(dt);
      draw();
      console.log("Frame simulated. dt:", dt);
      requestAnimationFrame(animationLoop);
    }
  
    // Start and stop simulation.
    function startOptimization() {
      if (!optimizing) {
        optimizing = true;
        lastTime = performance.now();
        requestAnimationFrame(animationLoop);
        console.log("Optimization started.");
      }
    }
  
    function stopOptimization() {
      optimizing = false;
      console.log("Optimization stopped.");
    }
  
    onMount(() => {
      canvas = document.getElementById("graphCanvas");
      ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      createRandomGraph();
      draw();
      console.log("Canvas initialized.");
    });
  </script>
  
  <style>
    canvas {
      border: 1px solid #ccc;
    }
    .controls {
      margin-top: 10px;
    }
    .control-section {
      margin-bottom: 10px;
    }
    .param-label {
      display: inline-block;
      width: 220px;
    }
    .control-input {
      margin-left: 5px;
    }
  </style>
  
  <main>
    <h1>Graph Optimizer (Repulsive Curves)</h1>
    
    <canvas id="graphCanvas"></canvas>
    
    <div class="controls">
      <div class="control-section">
        <label class="param-label" for="numNodes">Number of Circles (2-50):</label>
        <input id="numNodes" class="control-input" type="range" min="2" max="50" bind:value={numNodes} on:change={createRandomGraph} />
        <span>{numNodes}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="nodeRepulsion">Node Repulsion Strength (0-100000):</label>
        <input id="nodeRepulsion" class="control-input" type="range" min="0" max="1000000" step="1" bind:value={nodeRepulsionStrength} />
        <span>{nodeRepulsionStrength}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="nodeThreshold">Node Repulsion Threshold (10-500):</label>
        <input id="nodeThreshold" class="control-input" type="range" min="10" max="50000" step="10" bind:value={nodeThreshold} />
        <span>{nodeThreshold}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="dampingFactor">Damping Factor big vals destroy the universe, less th -1 = duplication. mo th 1 = acceleration:</label>
        <input id="dampingFactor" class="control-input" type="range" min="-1.1" max="1.1" step="0.1" bind:value={dampingFactor} />
        <span>{dampingFactor}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="curveThreshold">Curve Repulsion Threshold. if dist less than thresh then apply force. 0 = bug = lines. (10-200):</label>
        <input id="curveThreshold" class="control-input" type="range" min="10" max="20000" step="0.5" bind:value={curveRepulsionThreshold} />
        <span>{curveRepulsionThreshold}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="curveStrength">Curve Repulsion Strength everything more than 1 is crazy. neg vals just do the same but in opp dir.:</label>
        <input id="curveStrength" class="control-input" type="range" min="-0.1" max="1.1" step="0.01" bind:value={curveRepulsionStrength} />
        <span>{curveRepulsionStrength}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="offsetScale">Offset Scale (0-50):</label>
        <input id="offsetScale" class="control-input" type="range" min="0" max="50" step="1" bind:value={offsetScale} />
        <span>{offsetScale}</span>
      </div>
      <!-- Optional snake oscillation parameters -->
      <div class="control-section">
        <label class="param-label" for="snakeFreq">Snake Frequency:</label>
        <input id="snakeFreq" class="control-input" type="range" min="0" max="10" step="0.1" bind:value={snakeFrequency} />
        <span>{snakeFrequency}</span>
      </div>
      <div class="control-section">
        <label class="param-label" for="snakeAmp">Snake Amplitude:</label>
        <input id="snakeAmp" class="control-input" type="range" min="0" max="100" step="1" bind:value={snakeAmplitude} />
        <span>{snakeAmplitude}</span>
      </div>
      <div class="control-section">
        <button on:click={startOptimization}>Start Optimization</button>
        <button on:click={stopOptimization}>Stop Optimization</button>
      </div>
    </div>
  </main>
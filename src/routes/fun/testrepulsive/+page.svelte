
<script>
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";

  let numNodes = 20; // default number of nodes, adjustable via slider (2-50)
  let scene, camera, renderer;
  let nodes = [];
  let edges = []; // Each edge: { source, target, control, line }
  let fixedNodeIndex = null; // one node will be fixed (highlighted in red)
  let animationId = null;
  let simulationRunning = false;

  // Start the optimization simulation (force-directed layout)
  function startOptimization() {
    simulationRunning = true;
    animate();
  }

  // Stop the simulation
  function stopOptimization() {
    simulationRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
  }

  // Generates a new random graph and resets the simulation
  function generateGraph() {
    nodes = [];
    edges = [];
    
    // If scene already exists, remove all existing children
    if (scene) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }
    
    // Create nodes with random positions in the XY-plane (z = 0)
    for (let i = 0; i < numNodes; i++) {
      let x = (Math.random() - 0.5) * 100;
      let y = (Math.random() - 0.5) * 100;
      let z = 0;
      nodes.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(0, 0, 0),
        mesh: null
      });
    }
    
    // Select one random node to be fixed (its position will not change)
    fixedNodeIndex = Math.floor(Math.random() * numNodes);
    
    // Visualize nodes as spheres; fixed node is red, others are blue
    nodes.forEach((node, index) => {
      const geometry = new THREE.SphereGeometry(2, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: index === fixedNodeIndex ? 0xff0000 : 0x0000ff
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(node.position);
      node.mesh = sphere;
      scene.add(sphere);
    });
    
    // Create random edges between nodes - one edge per unordered pair with 20% probability
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (Math.random() < 0.2) {
          edges.push({
            source: i,
            target: j,
            control: null,
            line: null
          });
        }
      }
    }
    
    // For each edge, create a curved line using a quadratic Bezier curve
    edges.forEach(edge => {
      const src = nodes[edge.source].position;
      const tgt = nodes[edge.target].position;
      const mid = new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5);
      
      // Compute perpendicular offset in the XY-plane.
      const dir = new THREE.Vector3().subVectors(tgt, src);
      const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
      const offset = perp.multiplyScalar((Math.random() - 0.5) * 20);
      const control = new THREE.Vector3().addVectors(mid, offset);
      edge.control = control;
      
      // Create a quadratic Bezier curve and generate points for the edge
      const curve = new THREE.QuadraticBezierCurve3(src, control, tgt);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const line = new THREE.Line(geometry, material);
      edge.line = line;
      scene.add(line);
    });
  }

  // Initialize Three.js scene, camera, and renderer (only runs in the browser)
  function initScene() {
    if (typeof window === "undefined") return;
    const canvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    generateGraph();
  }

  // Basic force-directed simulation updating node positions and edge curves
  function simulate() {
    const repulsionStrength = 5;
    const springStrength = 0.01;
    const damping = 0.85;

    // Update positions of each node (except the fixed node)
    for (let i = 0; i < numNodes; i++) {
      if (i === fixedNodeIndex) continue;
      const node = nodes[i];
      const force = new THREE.Vector3();
      
      // Repulsive forces from every other node
      for (let j = 0; j < numNodes; j++) {
        if (i === j) continue;
        const other = nodes[j];
        const diff = new THREE.Vector3().subVectors(node.position, other.position);
        const distSq = diff.lengthSq() + 0.01; // prevent division by zero
        const rep = diff.normalize().multiplyScalar(repulsionStrength / distSq);
        force.add(rep);
      }
      
      // Attractive (spring) forces along edges connected to this node
      edges.forEach(edge => {
        if (edge.source === i || edge.target === i) {
          const otherIndex = edge.source === i ? edge.target : edge.source;
          const other = nodes[otherIndex];
          const spring = new THREE.Vector3()
            .subVectors(other.position, node.position)
            .multiplyScalar(springStrength);
          force.add(spring);
        }
      });
      
      // Update velocity and position based on computed force and damping
      node.velocity.add(force);
      node.velocity.multiplyScalar(damping);
      node.position.add(node.velocity);
      // Enforce planarity: keep z = 0
      node.position.z = 0;
    }

    // Update node mesh positions for rendering
    nodes.forEach((node) => {
      if (node.mesh) node.mesh.position.copy(node.position);
    });

    // Update edge curves based on new node positions
    edges.forEach(edge => {
      const src = nodes[edge.source].position;
      const tgt = nodes[edge.target].position;
      const mid = new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(tgt, src);
      let perp = new THREE.Vector3(-dir.y, dir.x, 0);
      if (perp.length() === 0) perp = new THREE.Vector3(1, 0, 0);
      perp.normalize();
      const randomOffset = perp.multiplyScalar((Math.random() - 0.5) * 5);
      const targetControl = new THREE.Vector3().addVectors(mid, randomOffset);
      // Smoothly interpolate between old control and the new target
      edge.control.lerp(targetControl, 0.1);
      
      const curve = new THREE.QuadraticBezierCurve3(src, edge.control, tgt);
      const points = curve.getPoints(50);
      edge.line.geometry.setFromPoints(points);
    });
  }

  // Main animation loop: update simulation and render the scene
  function animate() {
    if (!simulationRunning) return;
    simulate();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }
  
  // Reset the graph by stopping simulation and generating a new random graph
  function resetGraph() {
    stopOptimization();
    generateGraph();
    renderer.render(scene, camera);
  }

  // Handle window resize events in the browser
  function onWindowResize() {
    if (typeof window === "undefined") return;
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  // Execute browser-dependent code in onMount
  onMount(() => {
    if (typeof window !== "undefined") {
      initScene();
      window.addEventListener("resize", onWindowResize);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined" && animationId) {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onWindowResize);
    }
  });
</script>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 600px;
    background-color: #f0f0f0;
  }
  .controls {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  label {
    font-weight: bold;
  }
</style>

<div>
  <canvas id="canvas"></canvas>
  <div class="controls">
    <label for="nodes">Number of Nodes: {numNodes}</label>
    <input type="range" id="nodes" min="2" max="50" bind:value={numNodes} on:change={resetGraph} />
    <button on:click={startOptimization}>Start Optimization</button>
    <button on:click={stopOptimization}>Stop Optimization</button>
    <button on:click={resetGraph}>Reset Graph</button>
  </div>
</div>

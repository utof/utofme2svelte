<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
      WebGLRenderer,
      PerspectiveCamera,
      Scene,
      Vector3,
      SphereGeometry,
      MeshBasicMaterial,
      Mesh,
      BufferGeometry,
      Line,
      CatmullRomCurve3,
      Object3D
    } from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  
    // Simulation parameters
    let numberNodes = 10;
    let running = false;
    let fixedNodeIndex = 0;
  
    // Force-directed simulation parameters
    const repulsionConstant = 1000; // Repulsive force magnitude
    const springConstant = 0.1;       // Attractive force factor along edges
    const damping = 0.85;             // Damping for velocity
    const dt = 0.02;                // Time step
  
    // Graph data structures
    let nodes = [];
    let edges = [];
  
    // Three.js essentials
    let container;
    let renderer;
    let camera;
    let scene;
    let controls;
    let animationFrame;
  
    // Materials and geometries
    const geometrySphere = new SphereGeometry(0.5, 16, 16);
    const materialFixed = new MeshBasicMaterial({ color: 0xff0000 });
    const materialNormal = new MeshBasicMaterial({ color: 0x0077ff });
    const lineMaterial = new MeshBasicMaterial({ color: 0xffffff });
  
    // Parameters for curved edge creation
    const curveSegments = 20; // Number of points in the curve
  
    // Generate a random graph with nodes and curved edges
    function generateGraph() {
      // Clear previous nodes and edges from scene
      nodes.forEach((node) => scene.remove((node.sphere as Object3D)));
      edges.forEach((edge) => scene.remove(edge.line));
      nodes = [];
      edges = [];
  
      // Create nodes with random positions
      for (let i = 0; i < numberNodes; i++) {
        const pos = new Vector3(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30
        );
        const vel = new Vector3(0, 0, 0);
        const sphere = new Mesh(geometrySphere, materialNormal.clone());
        (sphere as any).position.copy(pos);
        scene.add(sphere);
        nodes.push({ pos, vel, fixed: false, sphere });
      }
      // Select one random node to be fixed and mark it red
      fixedNodeIndex = Math.floor(Math.random() * numberNodes);
      nodes[fixedNodeIndex].fixed = true;
      nodes[fixedNodeIndex].sphere.material = materialFixed.clone();
  
      // Create edges randomly between nodes (only one per pair)
      for (let i = 0; i < numberNodes; i++) {
        for (let j = i + 1; j < numberNodes; j++) {
          if (Math.random() < 0.3) { // 30% probability to create an edge
            const sourcePos = nodes[i].pos;
            const targetPos = nodes[j].pos;
            const restLength = sourcePos.distanceTo(targetPos);
            // Each edge gets a random phase for curvature offset
            const phase = Math.random() * Math.PI * 2;
            // Create initial curve geometry for the edge
            const curve = createCurvedEdge(nodes[i].pos, nodes[j].pos, phase, 0);
            const points = curve.getPoints(curveSegments);
            const geometry = new BufferGeometry().setFromPoints(points);
            const line = new Line(geometry, lineMaterial.clone());
            scene.add(line);
            edges.push({ source: i, target: j, restLength, line, phase });
          }
        }
      }
    }
  
    // Creates a curved edge using a CatmullRomCurve3.
    // The curve's control points include the start, an offset mid, and the end.
    function createCurvedEdge(start: Vector3, end: Vector3, phase: number, time: number): CatmullRomCurve3 {
      // Midpoint of the line
      const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
      // Compute a perpendicular direction for offset.
      let dir = new Vector3().subVectors(end, start).normalize();
      // Find an arbitrary vector not parallel to dir.
      let arbitrary = new Vector3(0, 1, 0);
      if (Math.abs(dir.dot(arbitrary)) > 0.9) {
        arbitrary = new Vector3(1, 0, 0);
      }
      const perp = new Vector3().crossVectors(dir, arbitrary).normalize();
      // Oscillate offset magnitude based on time and the random phase.
      const offsetMagnitude = 3 * Math.sin(time + phase);
      const offset = perp.multiplyScalar(offsetMagnitude);
      // Add offset to mid point.
      const control = new Vector3().addVectors(mid, offset);
      return new CatmullRomCurve3([start, control, end]);
    }
  
    // Update simulation using a force-directed approach.
    function updateSimulation(time: number) {
      // Reset forces array.
      const forces: Vector3[] = [];
      for (let i = 0; i < nodes.length; i++) {
        forces.push(new Vector3(0, 0, 0));
      }
      // Apply repulsive forces between every pair of nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const delta = new Vector3().subVectors(nodes[i].pos, nodes[j].pos);
          let distance = delta.length();
          distance = Math.max(distance, 0.1);
          const forceMagnitude = repulsionConstant / (distance * distance);
          const force = delta.normalize().multiplyScalar(forceMagnitude);
          forces[i].add(force);
          forces[j].sub(force);
        }
      }
      // Apply attractive (spring) forces for each edge.
      edges.forEach(edge => {
        const nodeA = nodes[edge.source];
        const nodeB = nodes[edge.target];
        const delta = new Vector3().subVectors(nodeB.pos, nodeA.pos);
        const distance = delta.length();
        const displacement = distance - edge.restLength;
        const force = delta.normalize().multiplyScalar(springConstant * displacement);
        forces[edge.source].add(force);
        forces[edge.target].sub(force);
      });
      // Update velocity and position (if not fixed) for nodes.
      nodes.forEach((node, idx) => {
        if (!node.fixed) {
          node.vel.add(forces[idx].multiplyScalar(dt));
          node.vel.multiplyScalar(damping);
          node.pos.add(node.vel.clone().multiplyScalar(dt));
        }
        // Update sphere position.
        (node.sphere as any).position.copy(node.pos);
      });
      // Update each edge's curve geometry to be dynamic.
      edges.forEach(edge => {
        const start = nodes[edge.source].pos;
        const end = nodes[edge.target].pos;
        const curve = createCurvedEdge(start, end, edge.phase, time);
        const points = curve.getPoints(curveSegments);
        const geometry = edge.line.geometry;
        geometry.setFromPoints(points);
        geometry.attributes.position.needsUpdate = true;
      });
    }
  
    function animate(time: number) {
      // Convert time from ms to seconds.
      const t = time * 0.001;
      if (running) {
        updateSimulation(t);
      }
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }
  
    // UI control functions.
    function startSimulation() {
      running = true;
    }
    function stopSimulation() {
      running = false;
    }
    function resetGraph() {
      running = false;
      generateGraph();
    }
  
    // Three.js scene initialization.
    onMount(() => {
      renderer = new WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);
  
      scene = new Scene();
      camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 50);
  
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
  
      generateGraph();
      animationFrame = requestAnimationFrame(animate);
  
      const resizeHandler = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", resizeHandler);
      onDestroy(() => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resizeHandler);
        renderer.dispose();
      });
    });
  </script>
  
  <style>
    :global(body) {
      margin: 0;
      overflow: hidden;
      font-family: sans-serif;
    }
    .controls {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 10;
      background: rgba(0,0,0,0.5);
      padding: 10px;
      border-radius: 4px;
      color: white;
    }
    .controls > * {
      margin: 5px 0;
    }
    /* Associate label with input using id and for attributes to fix a11y warning */
    label {
      display: block;
    }
  </style>
  
  <div bind:this={container}></div>
  <div class="controls">
    <div>
      <label for="nodeRange">Number of Nodes: {numberNodes}</label>
      <input id="nodeRange" type="range" min="2" max="50" bind:value={numberNodes} on:input={resetGraph} />
    </div>
    <button on:click={startSimulation}>Start Optimization</button>
    <button on:click={stopSimulation}>Stop Optimization</button>
    <button on:click={resetGraph}>Reset Graph</button>
  </div>
  
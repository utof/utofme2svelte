<script>
  import { onMount } from 'svelte';
  import * as fabric from 'fabric';

  let canvas;
  let isPanning = false;

  onMount(() => {
    canvas = new fabric.Canvas('mathmap-canvas', {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: false
    });

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    }

    // Event listener for canvas click (add rectangle)
    canvas.on('mouse:down', function (options) {
      if (options.target) {
        // if clicked on existing object
        return;
      }
      if (isPanning) {
        // if panning
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = options.e.clientX;
        this.lastPosY = options.e.clientY;
        return;
      }
      const pointer = canvas.getPointer(options.e);
      addRectangle(pointer.x, pointer.y);
    });

    canvas.on('mouse:move', function (options) {
      if (isPanning && this.isDragging) {
        var e = options.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', function (options) {
      if (isPanning) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
      }
    });

    // Event listeners for spacebar to enable panning
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        isPanning = true;
        canvas.defaultCursor = 'grab';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isPanning = false;
        canvas.defaultCursor = 'default';
      }
    });

    // Function to add a rectangle with text
    function addRectangle(x, y) {
      const rect = new fabric.Rect({
        left: x,
        top: y,
        fill: 'white',
        width: 100,
        height: 50,
        stroke: 'black',
        strokeWidth: 2
      });

      const text = new fabric.IText('Edit me', {
        left: x,
        top: y,
        fontSize: 20,
        textAlign: 'center',
        width: 100
      });

      const group = new fabric.Group([rect, text], {
        left: x,
        top: y,
        hasRotatingPoint: false,
      });

      // Make text editable on double click; bring text to front while editing.
      group.on('mousedblclick', () => {
        group.remove(text);
        text.left = group.left;
        text.top = group.top;
        canvas.add(text);
        canvas.bringToFront(text);
        text.enterEditing();
        text.selectAll();

        text.on('editing:exited', () => {
          group.addWithUpdate(text);
          canvas.remove(text);
          text.left = 0;
          text.top = 0;
          canvas.renderAll();
        });
      });

      canvas.add(group);
      canvas.setActiveObject(group);
    }

    // Function to add a circle
    function addCircle(x, y) {
      const circle = new fabric.Circle({
        left: x,
        top: y,
        fill: 'white',
        radius: 50,
        stroke: 'black',
        strokeWidth: 2
      });

      canvas.add(circle);
      canvas.setActiveObject(circle);
    }

    // Function to add a triangle
    function addTriangle(x, y) {
      const triangle = new fabric.Triangle({
        left: x,
        top: y,
        fill: 'white',
        width: 100,
        height: 100,
        stroke: 'black',
        strokeWidth: 2
      });

      canvas.add(triangle);
      canvas.setActiveObject(triangle);
    }

    // Expose functions for buttons
    window.addRectangle = addRectangle;
    window.addCircle = addCircle;
    window.addTriangle = addTriangle;
  });
</script>

<div class="button-container">
  <button on:click={() => {
    if (!canvas) return;
    const pointer = canvas.getPointer({e: {clientX: window.innerWidth / 2, clientY: window.innerHeight / 2}});
    window.addRectangle(pointer.x, pointer.y);
  }}>Add Rectangle</button>
  <button on:click={() => {
    if (!canvas) return;
    const pointer = canvas.getPointer({e: {clientX: window.innerWidth / 2, clientY: window.innerHeight / 2}});
    window.addCircle(pointer.x, pointer.y);
  }}>Add Circle</button>
  <button on:click={() => {
    if (!canvas) return;
    const pointer = canvas.getPointer({e: {clientX: window.innerWidth / 2, clientY: window.innerHeight / 2}});
    window.addTriangle(pointer.x, pointer.y);
  }}>Add Triangle</button>
  <button on:click={() => {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    if (activeObj.type !== 'activeSelection') return;
    activeObj.toGroup();
    canvas.requestRenderAll();
  }}>Group Selected</button>
  <button on:click={() => {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    if (activeObj.type !== 'group') return;
    activeObj.toActiveSelection();
    canvas.requestRenderAll();
  }}>Ungroup Selected</button>
</div>

<canvas id="mathmap-canvas"></canvas>

<style>
  /* Ensure the canvas fills the entire screen */
  canvas {
    border: 1px solid black; /* Optional: for visual clarity */
  }

  .button-container {
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  .button-container button {
    margin: 5px;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background-color: #007acc;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .button-container button:hover {
    background-color: #005a99;
  }
</style>

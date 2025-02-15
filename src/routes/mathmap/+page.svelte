<script>
	import { onMount } from 'svelte';

	let canvas;
  let ctx;

  let rectangles = [];

	onMount(() => {
    const width = window.innerWidth * 0.2;
    const height = window.innerHeight * 0.2;
		canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    setInterval(() => {
      addRectangle(Math.random() * (width - 50), Math.random() * (height-50), 50, 50);
      drawRectangles();
    }, 150);

    setInterval(() => {
      rectangles = [];
      drawRectangles();
    }, 2000)
	});

  function addRectangle(x, y, width, height) {
    const newRect = { x, y, width, height};
    rectangles.push(newRect);
  }

  function drawRectangles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const rect of rectangles) {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
      ctx.stroke();
    }
  }

</script>

<div>
	<canvas bind:this={canvas} ></canvas>
</div>

<style>
	canvas {
		border: 1px solid black;
	}
</style>

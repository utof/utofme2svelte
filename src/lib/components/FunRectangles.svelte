<script>
	import { onMount } from 'svelte';

	let canvas;
  let ctx;

  let rectangles = [];
  let width;
  let height;

	onMount(() => {

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    ctx = canvas.getContext('2d');

    setInterval(() => {
      addRectangle(Math.random() * (width - 50), Math.random() * (height-50), 50, 50);
      drawRectangles();
    }, 50);

    setInterval(() => {
      rectangles = [];
      drawRectangles();
    }, 2000)

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    }
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
	div {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
    z-index: -1;
	}
</style>

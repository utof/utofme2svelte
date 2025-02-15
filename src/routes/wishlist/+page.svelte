<script>
  import { onMount } from 'svelte';

  let wishlistItems = [];

  onMount(async () => {
    const response = await fetch('/api/wishlist');
    const text = await response.text();
    wishlistItems = text
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const satisfied = line.startsWith('- [x] ');
        const text = line.substring(6);
        return { text, satisfied };
      });
  });
</script>

<div class="container-custom">
  <h1 class="text-3xl font-bold mb-4">My Wishlist</h1>

  <ul>
    {#each wishlistItems as item}
      <li class="flex items-center mb-2">
        <input type="checkbox" disabled checked={item.satisfied} class="mr-2" />
        <span class={item.satisfied ? 'line-through' : ''}>
          {item.text}
        </span>
      </li>
    {/each}
  </ul>

  <a href="/" class="text-blue-500 hover:underline mt-4 inline-block">
    Back to Main Page
  </a>
</div>

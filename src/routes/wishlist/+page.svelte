<script>
  let wishlistItems = [
    { text: "Learn SvelteKit", satisfied: false },
    { text: "x Build a cool project", satisfied: true },
    { text: "Master Tailwind CSS", satisfied: false },
    { text: "x Contribute to open source", satisfied: true },
  ];
</script>

<div class="container-custom">
  <h1 class="text-3xl font-bold mb-4">My Wishlist</h1>

  <ul>
    {#each wishlistItems as item}
      <li class="flex items-center mb-2">
        <input type="checkbox" disabled checked={item.satisfied} class="mr-2" />
        <span class="{item.satisfied ? 'line-through' : ''}">
          {item.text.startsWith('x ') ? item.text.slice(2) : item.text}
        </span>
      </li>
    {/each}
  </ul>
</div>

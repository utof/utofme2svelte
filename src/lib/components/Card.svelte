<script lang="ts">
  export let title;
  export let icon;
  export let onHover;
</script>

<div class="card border border-gray-300 rounded-lg p-4 transition-transform duration-200 hover:scale-105" role="button" tabindex="0" on:mouseover={onHover} on:focus={onHover}>
  <div class="card-header flex items-center">
    <svelte:component this={icon} />
    <h2 class="ml-2">{title}</h2>
  </div>
  <div class="card-body mt-4">
    <slot></slot>
  </div>
</div>

<style>
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    transition: transform 0.2s;
  }
  .card:hover {
    transform: scale(1.05);
  }
  .card-header {
    display: flex;
    align-items: center;
  }
  .card-header h2 {
    margin-left: 8px;
  }
  .card-body {
    margin-top: 16px;
  }
</style>

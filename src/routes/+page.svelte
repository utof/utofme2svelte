<script>
  import InstaCard from '$lib/components/InstaCard.svelte';
  import TelegramCard from '$lib/components/TelegramCard.svelte';
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="w-full max-w-4xl grid gap-4 grid-cols-1 md:grid-cols-2">
    <InstaCard />
    <TelegramCard />
  </div>
</div>

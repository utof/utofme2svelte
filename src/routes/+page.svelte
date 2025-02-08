<script>
  import Card from '$lib/components/ui/card/Card.svelte';
  import placeholder1 from '$lib/components/tg.svg';
  import placeholder2 from '$lib/components/ig.svg';

  const links = [
    { logo: placeholder1, username: 'utofy', link: 'https://lemreny.t.me' },
    { logo: placeholder2, username: 'utofy', link: 'https://instagram.com/utofy' }
  ];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
  {#each links as { logo, username, link }}
    <Card {logo} {username} {link} />
  {/each}
  <!-- link to a test page -->
  <div class="col-span-full text-center mt-4">
    <a href="/test" class="text-blue-500 underline">Go to Test Page</a>
  </div>
</div>

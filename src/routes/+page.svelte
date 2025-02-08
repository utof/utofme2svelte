<script>
  import Card from '$lib/components/ui/card/Card.svelte';
  import placeholder1 from '$lib/components/placeholder1.svg';
  import placeholder2 from '$lib/components/placeholder2.svg';

  const links = [
    { logo: placeholder1, username: 'hello', link: 'https://lemreny.t.me' },
    { logo: placeholder2, username: 'world', link: 'https://instagram.com/utofy' }
  ];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
  {#each links as { logo, username, link }}
    <Card {logo} {username} {link} />
  {/each}
</div>

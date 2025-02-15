<script>
  import Card from '$lib/components/ui/card/Card.svelte';
  import { IconBrandTelegram, IconBrandInstagram, IconBrandSoundcloud, IconHeart } from '@tabler/icons-svelte';
  import { fade } from 'svelte/transition';

  const links = [
    { logo: IconBrandTelegram, username: '@utofy', link: 'https://utofy.t.me' },
    { logo: IconBrandTelegram, username: '@alpoati - my telegram channel', link: 'https://alpoati.t.me'},
    { logo: IconBrandInstagram, username: '@utofy', link: 'https://instagram.com/utofy' },
    { logo: IconBrandSoundcloud, username: '@utof', link: 'https://soundcloud.com/utof' },
    { logo: IconHeart, username: 'Support me on ko-fi!!', link: 'https://ko-fi.com/utofy' },

  ];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4" transition:fade={{ duration: 500 }}>
  {#each links as { logo, username, link }}
	<Card {logo} {username} link={link} on:click={() => openLink(link)} />
  {/each}
  <div class="col-span-full text-center mt-4">
    <a href="/test" class="text-blue-500 underline">Go to Test Page</a>
  </div>
  <div class="col-span-full text-center mt-4">
    <a href="/wishlist" class="text-blue-500 underline">Go to Wishlist Page</a>
  </div>
</div>

<script lang="ts">
import Card from './Card.svelte';
  import { Instagram } from 'lucide-svelte';
  import { loadSound } from '$lib/utils/lazySound.js';

  let photos = [];
  let isFetched = false;
  let showPhotos = false;

  const playHoverSound = loadSound('/sounds/hover.mp3');

  async function fetchInstagramPhotos() {
    if (isFetched) return;
    try {
      const res = await fetch('/api/instagram');
      const data = await res.json();
      photos = data.slice(0, 3);
    } catch (err) {
      console.error('Instagram API failed, using fallback images', err);
      photos = [
        '/fallbacks/insta1.jpg',
        '/fallbacks/insta2.jpg',
        '/fallbacks/insta3.jpg'
      ];
    }
    isFetched = true;
    showPhotos = true;
  }
</script>

<Card title="Instagram" icon={Instagram} onHover={() => { playHoverSound(); fetchInstagramPhotos(); }}>
  {#if showPhotos && photos.length > 0}
    <div class="mt-2 grid grid-cols-3 gap-2">
      {#each photos as photo}
        <img src={photo} alt="Instagram post" class="rounded-md object-cover" />
      {/each}
    </div>
  {/if}
</Card>

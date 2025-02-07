<script lang="ts">
import Card from './Card.svelte';
  import { MessageSquare } from 'lucide-svelte';
  import { loadSound } from '$lib/utils/lazySound.js';

  const playHoverSound = loadSound('/sounds/telegram-hover.mp3');
</script>

<Card title="Telegram" icon={MessageSquare} onHover={playHoverSound} />

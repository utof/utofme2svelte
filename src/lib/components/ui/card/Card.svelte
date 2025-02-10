<!-- todo unsorted: make card horizontal width constant -->
<script>
  export let logo;
  export let username;
  export let link;
</script>

<a href={link}>
{#if typeof logo === 'string'} 
    <img src={logo} alt="Logo" />
{:else}
<!-- i hate this ifelseness -->
    <svelte:component this={logo} class="img" />
{/if}
  <span class="text-lg">@{username}</span>
</a>

<style>
  a {
    display: flex;
    align-items: center;
    background-color: rgb(255, 255, 255);
    border: 1px solid #e5e7eb; /* gray-300 */
    border-radius: 2rem; /* rounded-lg */
    padding: 1rem; /* p-4 */
    color: rgb(44, 44, 44);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    margin: 1rem auto;
    max-width: 90%;
  }

  @media (min-width: 640px) {
    a {
      max-width: 600px;
      margin: 1rem auto;
    }
  }

  a:hover {
    border-color: rgb(196, 196, 196);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* hover:shadow-lg */
  }

  img {
    width: 2.5rem; /* w-10 */
    height: 2.5rem; /* h-10 */
    margin-right: 1rem; /* mr-4 */
  }

  span {
    font-size: 1.125rem; /* text-lg */
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-weight: 300;
  }
</style>

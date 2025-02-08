<script>
  export let logo;
  export let username;
  export let link;
</script>

<a href={link} class="flex items-center bg-white border border-gray-300 rounded-lg p-4 text-black transition-all duration-300 hover:border-black hover:shadow-lg">
  <img src={logo} alt="Logo" class="w-10 h-10 mr-4" />
  <span class="text-lg">@{username}</span>
</a>

<style>
  a {
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid #e5e7eb; /* gray-300 */
    border-radius: 0.5rem; /* rounded-lg */
    padding: 1rem; /* p-4 */
    color: black;
    transition: all 0.3s ease-in-out; /* transition-all duration-300 */
  }

  a:hover {
    border-color: black;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* hover:shadow-lg */
  }

  img {
    width: 2.5rem; /* w-10 */
    height: 2.5rem; /* h-10 */
    margin-right: 1rem; /* mr-4 */
  }

  span {
    font-size: 1.125rem; /* text-lg */
  }
</style>

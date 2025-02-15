<script>
    export const prerender = true;
    let { children } = $props();
    import "../app.css";
  </script>
  {@render children()}
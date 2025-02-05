import adapter from "@sveltejs/adapter-static";

const config = {
  kit: {
    adapter: adapter({
      fallback: "404.html",
    }),
    paths: {
      base: process.env.NODE_ENV === "development" ? "" : "/utofme2svelte", // <-- Ensure this matches your repo name
    },
    prerender: {
      handleHttpError: "warn", // Suppress 404 errors when prerendering
    },
  },
};

export default config;

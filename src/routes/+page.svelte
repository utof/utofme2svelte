<!-- <h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p> -->

<script>
    // No extra logic needed for now!
  </script>
  
  <style>
    /* Global body styles for a fun, vibrant background */
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: 'Comic Sans MS', cursive, sans-serif;
      background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
  
    .container {
      text-align: center;
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      max-width: 600px;
    }
  
    h1 {
      font-size: 3rem;
      margin: 0 0 1rem;
      animation: pop 0.8s ease-out;
    }
  
    @keyframes pop {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  
    p {
      font-size: 1.2rem;
      margin: 1rem 0;
      line-height: 1.5;
    }
  
    a.button {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.8rem 1.6rem;
      background: #0070f3;
      color: #fff;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: bold;
      transition: background 0.3s ease;
    }
  
    a.button:hover {
      background: #005bb5;
    }
  </style>
  
  <div class="container">
    <h1>Welcome to UTOF.ME</h1>
    <p>
      Here at UTOF.ME, we take your code and turn it into something ridiculously awesome!
      Expect slick design, witty vibes, and a dash of professional magic.
    </p>
    <p>
      Because why settle for boring when you can have extraordinary fun?
    </p>
    <a href="/test" class="button">Visit the Test Page</a>
  </div>
  
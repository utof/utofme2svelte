export async function GET() {
  // Mock response for Instagram API
  return new Response(
    JSON.stringify([
      "/images/insta1.jpg",
      "/images/insta2.jpg",
      "/images/insta3.jpg",
    ]),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

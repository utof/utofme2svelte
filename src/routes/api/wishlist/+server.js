import { readFileSync } from "fs";

export async function GET() {
  try {
    const data = readFileSync("wishlist.md", "utf8");
    return new Response(data);
  } catch (err) {
    console.error(err);
    return new Response("Error reading wishlist file", { status: 500 });
  }
}

# Personal Portfolio & Project Hub (SvelteKit)

todo unsorted:
[ ] why is the localhost loading up and reloading so slowly? What happened? it wasn't like that before.
[ ] d3?
[ ] have a "open source" and its a hyperlink to a github with this exact file.
[ ] add a "last updated" date at the bottom
[ ] click thru versions of the page.
[ ] add mcp for gh...

- [ ] other mcps?
      Todo longterm: add favicon.

DATE: 2/8/2025. v1

## Overview

This project is my personal portfolio and a creative playground where I showcase my web designs, music, projects, and experiments. It is built with SvelteKit and currently hosted on GitHub Pages (using adapter-static). Eventually, I might transition to Firebase, but for now, the site remains static.

The project must prioritize modularity and future-proofing, but without overcomplicating things. The structure should be flexible and fun to work with, meaning no premature optimization. If the project grows complex enough to require restructuring, make that call when needed.

## Key Features & Vision

- Showcasing Work: A central hub for my web design, music, and various projects.
- Examples of the features I plan to do (Mentioned as done or future feature to considered to avoid excessive refactoring.)
  - A music player that plays random tracks from my collection.
  - A mascot that dances along with the music and occasionally sends random messages in bubbles.
- Project Versions: A way to display different versions of a page to track progress over time.
- Fun & Aesthetic:
  - Various types of design, e.g. handwritten or dark modern or pixel art. In doubt (or for MVP), go with a clean, neomorphic look
- Hosting & Deployment:
  - Static site for now (adapter-static).
  - TailwindCSS for styling.

---

# Feature: LinkTree Alternative

## Goal

Create a custom link tree alternative with a minimalist and modern look. The first iteration should be simple but extensible, allowing easy expansion with more features later.

## Initial Implementation

### Step 1: Card Component

- A horizontal card with:
  - A logo on the left.
  - A link in the middle (or right-aligned, depending on styling).
- The component should be easily reusable, allowing dynamic population with different logos and text.
- Styling:
  - White background, rounded corners, thin white border.
  - Aesthetic should be sleek and modern.
  - Optionally, a grainy feel in the future.

### Step 2: Link Page

- A page (for v1 in routes/+page.svelte) that displays a grid of cards.
- This page should populate the card components dynamically.
- Rounded elements, thin white borders, and a smooth, grainy feel (potentially added later).

### Future Enhancements

- Integration of Telegram, Instagram, and other social links (links: lemreny.t.me, instagram.com/utofy)
- Additional customization options (color themes, animations, etc.).

## Notes

- The primary goal for now is functionality.
- Don't over-engineer the structure — just make it work and look good.
- Future features will be added iteratively.

---

This document will evolve as the project progresses either by human(me) or AI copilot(you). For now, the main focus is getting the link tree cards working while keeping the project structure simple and fun.

---

To add to prompt:

linktree:
hardcoded links and files. Also create a structure + folder + placeholder svg files and import them
Tailwind immediately. Initial static implementation but be very open for animation and future shenanigans like e.g. i want to animate borders, add sound effects on hover etc, events after clicking/tapping the link. The whole box/rectangle is a clickable (via hyperlink that is the text of the link). The whole link isnt displayed, only the username e.g. @hello

general:

1. when making commit messages, dont say e.g. "implement link card component with placeholders; update main page layout and add SVG assets", but shorten it e.g.: "init link card component w/ placeholders; update main page layout; add SVGs"
2. when u see a todo in a file as a comment, ask the use whether to implement it. After the current task is done. If it is a big task, break it down into smaller tasks and implement them one by one. Delete the todo after the task has been implemented successfully without any issues in the command line or problems in vscode.

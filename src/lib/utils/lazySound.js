export function loadSound(src) {
  if (typeof Audio !== "undefined") {
    let audio = new Audio(src);
    audio.preload = "none"; // Delay loading until needed
    return () => {
      audio.play().catch((err) => console.error("Audio play failed", err));
    };
  } else {
    return () => console.warn("Audio is not supported in this environment");
  }
}

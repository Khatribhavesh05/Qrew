import { readFileSync } from "fs";
import { resolve } from "path";

// Load FAL_API_KEY from .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
const falKey = envLines
  .find((l) => l.startsWith("FAL_API_KEY="))
  ?.split("=")
  .slice(1)
  .join("=")
  .trim();

if (!falKey) {
  console.error("FAL_API_KEY not found in .env.local");
  process.exit(1);
}

console.log("FAL_API_KEY found:", falKey.slice(0, 8) + "...");
console.log("Calling Fal.ai Flux Schnell...\n");

const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
  method: "POST",
  headers: {
    Authorization: `Key ${falKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "dark minimalist tech background, mesh gradient, abstract",
    image_size: "landscape_16_9",
    num_inference_steps: 4,
    num_images: 1,
    sync_mode: true,
    enable_safety_checker: false,
  }),
});

console.log("Status:", res.status, res.statusText);
console.log("Headers:", Object.fromEntries(res.headers.entries()));
console.log();

const raw = await res.text();

// Try to parse as JSON for pretty printing
try {
  const data = JSON.parse(raw);
  console.log("=== FULL RESPONSE (parsed) ===");
  console.log(JSON.stringify(data, null, 2));

  // Summarise what we got
  console.log("\n=== SUMMARY ===");
  if (data.images?.length) {
    data.images.forEach((img, i) => {
      const isBase64 = img.url?.startsWith("data:");
      const isUrl = img.url?.startsWith("http");
      console.log(`Image ${i}: type=${isBase64 ? "base64" : isUrl ? "URL" : "unknown"}`);
      if (isUrl) console.log(`  URL: ${img.url}`);
      if (isBase64) console.log(`  base64 length: ${img.url.length} chars`);
      if (img.width) console.log(`  Size: ${img.width}x${img.height}`);
      if (img.content_type) console.log(`  Content-Type: ${img.content_type}`);
    });
  } else {
    console.log("No images array in response.");
  }
} catch {
  console.log("=== RAW RESPONSE (not JSON) ===");
  console.log(raw.slice(0, 2000));
}

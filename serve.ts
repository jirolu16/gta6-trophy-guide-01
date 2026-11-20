// Leonida Legend - tiny local preview server.
//
// Serves the app folder over HTTP so the guide can be opened and
// screenshotted exactly as a browser would load it in production.
// Usage: node serve.ts [folder] [port]   (defaults: app, 8000)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import process from "node:process";

const root = process.argv[2] ?? "app";
const port = Number(process.argv[3] ?? "8000");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(process.cwd(), root, safePath);
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
});

server.listen(port, () => {
  console.log("Serving " + root + "/ at http://localhost:" + port + "/");
});

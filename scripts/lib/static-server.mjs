import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".wav": "audio/wav", ".mp4": "video/mp4",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain",
};

/** Minimal static host for ./out with Range support (like Vercel). */
export async function startServer(outDir, port = 0) {
  const server = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(outDir, p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (existsSync(`${file}.html`)) file = `${file}.html`;
      else if (existsSync(file) && statSync(file).isDirectory() && existsSync(join(file, "index.html"))) file = join(file, "index.html");
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const buf = readFileSync(file);
    const type = MIME[extname(file)] ?? "application/octet-stream";
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=0, must-revalidate" };
    const range = req.headers.range;
    if (range) {
      const [s, e] = range.replace("bytes=", "").split("-");
      const start = Number(s);
      const end = e ? Number(e) : buf.length - 1;
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${buf.length}`, "Content-Length": end - start + 1 });
      res.end(buf.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, { ...headers, "Content-Length": buf.length });
    res.end(buf);
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { server, port: server.address().port };
}

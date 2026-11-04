import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const port = 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const reply = (status, message) => {
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    reply(405, "Method not allowed");
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  } catch (error) {
    console.warn("Rejected malformed preview URL:", request.url, error.message);
    reply(400, "Invalid URL");
    return;
  }
  const allowed = pathname === "/" || pathname === "/index.html"
    || pathname.startsWith("/assets/") || pathname === "/resume/Liza_George_Resume.pdf";
  if (!allowed || pathname.split("/").some((part) => part.startsWith("."))) {
    reply(404, "Not found");
    return;
  }
  try {
    const path = await realpath(resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`));
    if (!path.startsWith(`${root}${sep}`) || !types[extname(path)]) {
      reply(404, "Not found");
      return;
    }
    const content = await readFile(path);
    response.writeHead(200, {
      "Content-Type": types[extname(path)],
      "Content-Length": content.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "EISDIR") {
      reply(404, "Not found");
      return;
    }
    console.error("Could not serve preview request:", request.url, error);
    reply(500, "Could not read the requested file");
  }
});

server.on("error", (error) => {
  console.error("Could not start the portfolio preview:", error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Portfolio preview: http://${host}:${port}`);
});

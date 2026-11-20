// Servidor local sin dependencias: node server.mjs  →  http://localhost:5500
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL(".", import.meta.url));
const PUERTO = process.env.PORT || 5500;
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".json": "application/json" };

createServer(async (req, res) => {
  try {
    let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (ruta.endsWith("/")) ruta += "index.html";
    const archivo = join(RAIZ, normalize(ruta));
    if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    const datos = await readFile(archivo);
    res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(datos);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado");
  }
}).listen(PUERTO, () => console.log(`Pie de Limón en http://localhost:${PUERTO}`));

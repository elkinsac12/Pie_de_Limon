/* Utilidades compartidas */
import { WHATSAPP } from "./config.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const moneda = n => "$" + Math.round(n || 0).toLocaleString("es-CO");
export const waURL = txt => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;
export const tienePrecio = p => typeof p.precio === "number" && p.precio > 0;

export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Foto de un producto: el nombre de archivo (con extensión) viene de data/productos.json.
// Ruta relativa: funciona con Live Server y con cualquier servidor local.
export const imgProducto = nombre => `assets/img/productos/${encodeURIComponent(nombre)}`;

// Imagen de respaldo (se ve mientras la foto no esté en la carpeta o si el nombre no coincide)
export const IMG_RESPALDO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#eef8f5'/>` +
  `<circle cx='200' cy='140' r='46' fill='#f2a00e'/><path d='M200 96Q198 70 170 64Q168 92 192 100Z' fill='#4eb9a5'/>` +
  `<text x='200' y='238' font-family='sans-serif' font-size='18' text-anchor='middle' fill='#4a6b67'>Foto pendiente</text></svg>`);

// Si una foto no carga, se cambia por la imagen de respaldo (una sola vez por imagen)
export function activarRespaldoImagenes() {
  document.addEventListener("error", e => {
    const el = e.target;
    if (el instanceof HTMLImageElement && el.dataset.foto !== undefined && !el.dataset.respaldo) {
      el.dataset.respaldo = "1";
      el.removeAttribute("srcset");
      el.src = IMG_RESPALDO;
    }
  }, true);
}

// Guardado local seguro: si el navegador lo bloquea, la página sigue funcionando.
export const local = {
  leer(clave, defecto) {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; } catch (_) { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* sin almacenamiento */ }
  }
};

let tAviso;
export function aviso(texto, accion) {
  const caja = $("#aviso");
  $("#avisoTxt").textContent = texto;
  caja.querySelector("button")?.remove();
  if (accion) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = accion.texto;
    b.addEventListener("click", () => { accion.fn(); caja.classList.remove("on"); });
    caja.appendChild(b);
  }
  caja.classList.add("on");
  clearTimeout(tAviso);
  tAviso = setTimeout(() => caja.classList.remove("on"), accion ? 5000 : 2600);
}

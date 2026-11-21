/* Arranque de la landing */
import { INSTAGRAM, FACEBOOK, VALORES, HERO_IMAGEN } from "./config.js";
import { $, $$, esc, imgProducto, activarRespaldoImagenes } from "./util.js";
import { cargarProductos, iniciarCatalogo } from "./catalogo.js";
import { iniciarCarrito } from "./carrito.js";

function iniciarBarra() {
  const barra = $("#barra"), nav = $("#nav"), btn = $("#menuBtn");
  const alHacerScroll = () => barra.classList.toggle("solida", scrollY > 30);
  addEventListener("scroll", alHacerScroll, { passive: true });
  alHacerScroll();
  const cerrarMenu = () => { nav.classList.remove("abierta"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => btn.setAttribute("aria-expanded", nav.classList.toggle("abierta")));
  $$("a", nav).forEach(a => a.addEventListener("click", cerrarMenu));
}

function iniciarContenido() {
  activarRespaldoImagenes();
  $("#heroImg").src = imgProducto(HERO_IMAGEN);
  for (const id of ["lnkInstagram", "pieInstagram"]) $("#" + id).href = INSTAGRAM;
  for (const id of ["lnkFacebook", "pieFacebook"]) $("#" + id).href = FACEBOOK;
  $("#valores").innerHTML = VALORES.map(v =>
    `<div class="valor"><span class="ico" aria-hidden="true">${v.icono}</span><h3>${esc(v.titulo)}</h3><p>${esc(v.texto)}</p></div>`).join("");
}

iniciarBarra();
iniciarContenido();

try {
  const productos = await cargarProductos();
  iniciarCatalogo();
  iniciarCarrito(productos);
} catch (err) {
  console.error(err);
  $("#grilla").innerHTML = `<p class="sin-prod">No se pudo cargar el catálogo. Abre la página con un servidor local (ver README) y revisa data/productos.json.</p>`;
  iniciarCarrito([]);
}
if (window.AOS) {
  window.AOS.init({
    duration: 800,
    once: true,
  });
}
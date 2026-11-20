/* Catálogo: categorías con íconos + pestañas + tarjetas (foto, nombre, precio y botón "+") */
import { CATEGORIAS } from "./config.js";
import { $, $$, esc, moneda, tienePrecio, imgProducto } from "./util.js";
import { agregar } from "./carrito.js";

let productos = [];
let actual = "todos";

export async function cargarProductos() {
  const r = await fetch("data/productos.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("No se pudo leer data/productos.json");
  const { productos: lista } = await r.json();
  productos = lista.filter(p => p && p.id && p.nombre && p.imagen);
  return productos;
}

const cantidad = id => id === "todos" ? productos.length : productos.filter(p => p.categoria === id).length;

function tarjeta(p) {
  const precio = tienePrecio(p) ? moneda(p.precio) : "Consultar";
  return `<article class="prod" data-id="${esc(p.id)}">
    <div class="prod-foto">
      <img data-foto src="${imgProducto(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy" decoding="async" width="600" height="450">
    </div>
    <div class="prod-info">
      <h3>${esc(p.nombre)}</h3>
      ${p.descripcion ? `<p class="prod-desc">${esc(p.descripcion)}</p>` : ""}
      <div class="prod-pie">
        <span class="prod-precio${tienePrecio(p) ? "" : " consultar"}">${precio}</span>
        <button type="button" class="mas" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.nombre)} al pedido">+</button>
      </div>
    </div>
  </article>`;
}

function pintarGrilla() {
  const lista = actual === "todos" ? productos : productos.filter(p => p.categoria === actual);
  $("#grilla").innerHTML = lista.length
    ? lista.map(tarjeta).join("")
    : `<p class="sin-prod">Aún no hay productos en esta categoría.</p>`;
}

export function seleccionar(id, { desplazar = false } = {}) {
  actual = id;
  $$("#pestanas button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.cat === id)));
  $$("#iconos button").forEach(b => b.classList.toggle("activa", b.dataset.cat === id));
  pintarGrilla();
  if (desplazar) $("#productos").scrollIntoView({ behavior: "smooth", block: "start" });
}

export function iniciarCatalogo() {
  // Solo se muestran categorías que tienen productos (más "Todos")
  const cats = CATEGORIAS.filter(c => cantidad(c.id) > 0);
  const variasCategorias = cats.length > 1;
  $(".categorias").hidden = !variasCategorias;
  $("#pestanas").hidden = !variasCategorias;

  $("#iconos").innerHTML = cats.map(c =>
    `<button type="button" data-cat="${esc(c.id)}"><span class="ico" aria-hidden="true">${c.icono}</span><span>${esc(c.nombre)}</span></button>`).join("");

  $("#pestanas").innerHTML = [{ id: "todos", nombre: "Todos" }, ...cats].map(c =>
    `<button type="button" role="tab" data-cat="${esc(c.id)}" aria-selected="${c.id === "todos"}">${esc(c.nombre)} <small>${cantidad(c.id)}</small></button>`).join("");

  $("#pestanas").addEventListener("click", e => { const b = e.target.closest("button"); if (b) seleccionar(b.dataset.cat); });
  $("#iconos").addEventListener("click", e => { const b = e.target.closest("button"); if (b) seleccionar(b.dataset.cat, { desplazar: true }); });
  $("#grilla").addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if (b) agregar(b.dataset.add);
  });
  seleccionar("todos");
}

/* Pie de Limón · lógica de la landing (script clásico: no necesita servidor ni módulos) */
(function () {
"use strict";
const { NEGOCIO, WHATSAPP, INSTAGRAM, FACEBOOK, CATEGORIAS, VALORES, HERO_IMAGEN, ENTREGAS, MAX_POR_LINEA } = window.CONFIG;

// ===================== Utilidades =====================
/* Utilidades compartidas */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const moneda = n => "$" + Math.round(n || 0).toLocaleString("es-CO");
const waURL = txt => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;
const tienePrecio = p => typeof p.precio === "number" && p.precio > 0;

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Foto de un producto: el nombre de archivo (con extensión) viene de data/productos.json.
// Ruta relativa: funciona con Live Server y con cualquier servidor local.
const imgProducto = nombre => `assets/img/productos/${encodeURIComponent(nombre)}`;

// Imagen de respaldo (se ve mientras la foto no esté en la carpeta o si el nombre no coincide)
const IMG_RESPALDO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#eef8f5'/>` +
  `<circle cx='200' cy='140' r='46' fill='#f2a00e'/><path d='M200 96Q198 70 170 64Q168 92 192 100Z' fill='#4eb9a5'/>` +
  `<text x='200' y='238' font-family='sans-serif' font-size='18' text-anchor='middle' fill='#4a6b67'>Foto pendiente</text></svg>`);

// Si una foto no carga, se cambia por la imagen de respaldo (una sola vez por imagen)
function activarRespaldoImagenes() {
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
const local = {
  leer(clave, defecto) {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; } catch (_) { return defecto; }
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* sin almacenamiento */ }
  }
};

let tAviso;
function aviso(texto, accion) {
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

// ===================== Pedido =====================
const Carrito = (function () {
/* Pedido: agregar, cambiar cantidades, quitar con "Deshacer" y enviar por WhatsApp.
   Se guarda en este navegador para no perderlo al recargar. */


const CLAVE = "pedido_piedelimon_v2";
const CLAVE_DATOS = "pedido_piedelimon_datos_v2";
let productos = new Map();
let lineas = [];                       // [{ id, cant }]
let datos = local.leer(CLAVE_DATOS, { nombre: "", ciudad: "", fecha: "", entrega: ENTREGAS[0], notas: "" });
let ultimoFoco = null;

const limpiar = lista => (Array.isArray(lista) ? lista : [])
  .filter(l => productos.has(l.id) && Number.isInteger(l.cant) && l.cant > 0)
  .map(l => ({ id: l.id, cant: Math.min(l.cant, MAX_POR_LINEA) }));

const unidades = () => lineas.reduce((a, l) => a + l.cant, 0);
const total = () => lineas.reduce((a, l) => { const p = productos.get(l.id); return a + (tienePrecio(p) ? p.precio * l.cant : 0); }, 0);
const textoTotal = () => (total() === 0 && porCotizar() ? "por confirmar" : moneda(total()));
const porCotizar = () => lineas.filter(l => !tienePrecio(productos.get(l.id))).length;

function guardar() { local.guardar(CLAVE, lineas); pintar(); }

function agregar(id) {
  const p = productos.get(id);
  if (!p) return;
  const ya = lineas.find(l => l.id === id);
  if (ya) ya.cant = Math.min(MAX_POR_LINEA, ya.cant + 1); else lineas.push({ id, cant: 1 });
  guardar();
  const num = $("#numCarrito");
  if (num) { num.classList.remove("salta"); void num.offsetWidth; num.classList.add("salta"); }
  aviso(`${p.nombre} agregado`, { texto: "Ver pedido", fn: abrir });
}

function quitar(i) {
  const [quitada] = lineas.splice(i, 1);
  guardar();
  aviso(`Quitaste ${productos.get(quitada.id).nombre}`, {
    texto: "Deshacer",
    fn: () => { lineas.splice(Math.min(i, lineas.length), 0, quitada); guardar(); }
  });
}

function mensaje() {
  if (!lineas.length) return `Hola ${NEGOCIO} 🍋 Quiero conocer más sobre sus productos.`;
  const filas = lineas.map(l => {
    const p = productos.get(l.id);
    return `• ${l.cant} x ${p.nombre} — ${tienePrecio(p) ? moneda(p.precio * l.cant) : "precio por confirmar"}`;
  });
  let txt = `Hola ${NEGOCIO} 🍋 Quiero hacer este pedido:\n\n` + filas.join("\n");
  txt += `\n\nTotal: ${textoTotal()}${total() > 0 && porCotizar() ? " + productos por confirmar" : ""} (sin domicilio)`;
  txt += `\nEntrega: ${datos.entrega}`;
  const nombre = (datos.nombre || "").trim(), ciudad = (datos.ciudad || "").trim(), fecha = (datos.fecha || "").trim(), notas = (datos.notas || "").trim();
  if (nombre) txt += `\nNombre: ${nombre}`;
  if (ciudad) txt += `\nCiudad / barrio: ${ciudad}`;
  if (fecha) txt += `\nFecha deseada: ${fecha}`;
  if (notas) txt += `\nNotas: ${notas}`;
  return txt + "\n\n¿Cómo coordinamos el pago y la entrega?";
}

function pintar() {
  const n = unidades();
  const numEl = $("#numCarrito");               // el botón del encabezado es opcional (está comentado en index.html)
  if (numEl) numEl.textContent = n;
  const cuenta = $("#granoCuenta");
  cuenta.textContent = n;
  cuenta.classList.toggle("on", n > 0);
  const grano = $("#grano");
  grano.setAttribute("aria-label", n ? `Ver tu pedido (${n})` : "Escribir por WhatsApp");
  grano.href = waURL(mensaje());
  $("#btnContacto").href = waURL(lineas.length ? mensaje() : `Hola ${NEGOCIO} 🍋 Tengo una pregunta sobre sus productos.`);

  const cuerpo = $("#carritoCuerpo");
  $("#carritoPie").hidden = !lineas.length;
  if (!lineas.length) {
    cuerpo.innerHTML = `<div class="vacio"><p>Tu pedido está vacío. Toca el botón <b>+</b> de un producto para agregarlo.</p>
      <a class="btn btn-naranja" href="#productos" data-cerrar>Ver productos</a></div>`;
    return;
  }

  cuerpo.innerHTML = lineas.map((l, i) => {
    const p = productos.get(l.id);
    return `<article class="linea" data-i="${i}">
      <img data-foto src="${imgProducto(p.imagen)}" alt="" width="72" height="72">
      <div>
        <div class="linea-top"><h3>${esc(p.nombre)}</h3><span class="linea-precio">${tienePrecio(p) ? moneda(p.precio * l.cant) : "Consultar"}</span></div>
        <div class="linea-pie">
          <div class="paso" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
            <button type="button" data-d="-1" aria-label="Quitar uno">−</button>
            <output aria-live="polite">${l.cant}</output>
            <button type="button" data-d="1" aria-label="Agregar uno">+</button>
          </div>
          <button type="button" class="quitar" data-quitar>Quitar</button>
        </div>
      </div>
    </article>`;
  }).join("") + `<div class="datos-pedido">
      <label>Entrega
        <select id="pedEntrega">${ENTREGAS.map(v => `<option${v === datos.entrega ? " selected" : ""}>${esc(v)}</option>`).join("")}</select>
      </label>
      <label>Tu nombre (opcional)<input id="pedNombre" maxlength="60" autocomplete="name" value="${esc(datos.nombre)}"></label>
      <label>Ciudad o barrio (opcional)<input id="pedCiudad" maxlength="80" autocomplete="address-level2" value="${esc(datos.ciudad)}"></label>
      <label>Fecha deseada (opcional)<input id="pedFecha" maxlength="40" placeholder="Ej: sábado 21, 4 p. m." value="${esc(datos.fecha)}"></label>
      <label class="ancho">Notas (opcional)<input id="pedNotas" maxlength="120" value="${esc(datos.notas)}"></label>
    </div>`;

  $("#carritoTotal").textContent = total() === 0 && porCotizar() ? "Por confirmar" : moneda(total());
  $("#carritoNota").textContent = porCotizar()
    ? "Hay productos por confirmar: te enviamos el valor final por WhatsApp. El domicilio se cotiza según tu zona."
    : "El domicilio se cotiza por WhatsApp según tu ciudad o barrio.";
  $("#enviarPedido").href = waURL(mensaje());
}

function abrir() {
  ultimoFoco = document.activeElement;
  $("#aviso").classList.remove("on");
  $("#carrito").classList.add("abierto");
  $("#carrito").setAttribute("aria-hidden", "false");
  $("#velo").classList.add("abierto");
  document.body.classList.add("carrito-abierto");
  $("#cerrarCarrito").focus();
}

function cerrar() {
  $("#carrito").classList.remove("abierto");
  $("#carrito").setAttribute("aria-hidden", "true");
  $("#velo").classList.remove("abierto");
  document.body.classList.remove("carrito-abierto");
  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}

function iniciarCarrito(lista) {
  productos = new Map(lista.map(p => [p.id, p]));
  lineas = limpiar(local.leer(CLAVE, []));
  if (!ENTREGAS.includes(datos.entrega)) datos.entrega = ENTREGAS[0];

  const cuerpo = $("#carritoCuerpo");
  cuerpo.addEventListener("click", e => {
    if (e.target.closest("[data-cerrar]")) { cerrar(); return; }
    const art = e.target.closest(".linea");
    if (!art) return;
    const i = +art.dataset.i;
    const paso = e.target.closest("[data-d]");
    if (paso) {
      const nueva = lineas[i].cant + Number(paso.dataset.d);
      if (nueva < 1) quitar(i); else { lineas[i].cant = Math.min(MAX_POR_LINEA, nueva); guardar(); }
      return;
    }
    if (e.target.closest("[data-quitar]")) quitar(i);
  });
  cuerpo.addEventListener("input", e => {
    const campos = { pedNombre: "nombre", pedCiudad: "ciudad", pedFecha: "fecha", pedNotas: "notas", pedEntrega: "entrega" };
    const campo = campos[e.target.id];
    if (!campo) return;
    datos[campo] = e.target.value;
    local.guardar(CLAVE_DATOS, datos);
    const url = waURL(mensaje());
    $("#enviarPedido").href = url;
    $("#grano").href = url;
  });

  $("#abrirCarrito")?.addEventListener("click", abrir);   // botón del encabezado (comentado en index.html)
  $("#cerrarCarrito").addEventListener("click", cerrar);
  $("#velo").addEventListener("click", cerrar);
  $("#vaciarCarrito").addEventListener("click", () => {
    const copia = lineas;
    lineas = [];
    guardar();
    aviso("Vaciaste el pedido", { texto: "Deshacer", fn: () => { lineas = copia; guardar(); } });
  });
  // El botón flotante abre el pedido si hay productos; si no, va directo a WhatsApp
  $("#grano").addEventListener("click", e => { if (lineas.length) { e.preventDefault(); abrir(); } });
  addEventListener("keydown", e => { if (e.key === "Escape" && $("#carrito").classList.contains("abierto")) cerrar(); });
  addEventListener("storage", e => { if (e.key === CLAVE) { lineas = limpiar(local.leer(CLAVE, [])); pintar(); } });
  pintar();
}
return { agregar, iniciarCarrito, abrir, cerrar, pintar };
})();
const { iniciarCarrito } = Carrito;

// ===================== Catálogo =====================
const Catalogo = (function () {
/* Catálogo: categorías con íconos + pestañas + tarjetas (foto, nombre, precio y botón "+") */



let productos = [];
let actual = "todos";

function cargarProductos() {
  productos = (window.PRODUCTOS || []).filter(p => p && p.id && p.nombre && p.imagen);
  return productos;
}

const cantidad = id => id === "todos" ? productos.length : productos.filter(p => p.categoria === id).length;

function tarjeta(p) {
  const precio = tienePrecio(p) ? moneda(p.precio) : "Consultar";
  return `<article class="prod" data-id="${esc(p.id)}">
    <div class="prod-foto">
      <img data-foto src="${imgProducto(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy" decoding="async" width="600" height="450"${p.posicion ? ` style="object-position:${esc(p.posicion)}"` : ""}>
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

function seleccionar(id, { desplazar = false } = {}) {
  actual = id;
  $$("#pestanas button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.cat === id)));
  $$("#iconos button").forEach(b => b.classList.toggle("activa", b.dataset.cat === id));
  pintarGrilla();
  if (desplazar) $("#productos").scrollIntoView({ behavior: "smooth", block: "start" });
}

function iniciarCatalogo() {
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
    if (b) Carrito.agregar(b.dataset.add);
  });
  seleccionar("todos");
}
return { cargarProductos, iniciarCatalogo };
})();
const { cargarProductos, iniciarCatalogo } = Catalogo;

// ===================== Arranque =====================
/* Arranque de la landing */




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
  $("#anio").textContent = new Date().getFullYear();
  $("#valores").innerHTML = VALORES.map(v =>
    `<div class="valor"><span class="ico" aria-hidden="true">${v.icono}</span><h3>${esc(v.titulo)}</h3><p>${esc(v.texto)}</p></div>`).join("");
}

iniciarBarra();
iniciarContenido();

try {
  const productos = cargarProductos();
  iniciarCatalogo();
  iniciarCarrito(productos);
} catch (err) {
  console.error(err);
  $("#grilla").innerHTML = `<p class="sin-prod">No se pudo cargar el catálogo. Abre la página con un servidor local (ver README) y revisa data/productos.json.</p>`;
  iniciarCarrito([]);
}
})();

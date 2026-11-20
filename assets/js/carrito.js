/* Pedido: agregar, cambiar cantidades, quitar con "Deshacer" y enviar por WhatsApp.
   Se guarda en este navegador para no perderlo al recargar. */
import { NEGOCIO, ENTREGAS, MAX_POR_LINEA } from "./config.js";
import { $, aviso, esc, local, moneda, waURL, tienePrecio, imgProducto } from "./util.js";

const CLAVE = "pedido_piedelimon_v2";
const CLAVE_DATOS = "pedido_piedelimon_datos_v2";
let productos = new Map();
let lineas = [];                       // [{ id, cant }]
let datos = local.leer(CLAVE_DATOS, { nombre: "", ciudad: "", fecha: "", entrega: ENTREGAS[0], notas: "" });
let ultimoFoco = null;

const limpiar = lista => (Array.isArray(lista) ? lista : [])
  .filter(l => productos.has(l.id) && Number.isInteger(l.cant) && l.cant > 0)
  .map(l => ({ id: l.id, cant: Math.min(l.cant, MAX_POR_LINEA) }));

export const unidades = () => lineas.reduce((a, l) => a + l.cant, 0);
const total = () => lineas.reduce((a, l) => { const p = productos.get(l.id); return a + (tienePrecio(p) ? p.precio * l.cant : 0); }, 0);
const textoTotal = () => (total() === 0 && porCotizar() ? "por confirmar" : moneda(total()));
const porCotizar = () => lineas.filter(l => !tienePrecio(productos.get(l.id))).length;

function guardar() { local.guardar(CLAVE, lineas); pintar(); }

export function agregar(id) {
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

export function pintar() {
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

export function abrir() {
  ultimoFoco = document.activeElement;
  $("#aviso").classList.remove("on");
  $("#carrito").classList.add("abierto");
  $("#carrito").setAttribute("aria-hidden", "false");
  $("#velo").classList.add("abierto");
  document.body.classList.add("carrito-abierto");
  $("#cerrarCarrito").focus();
}

export function cerrar() {
  $("#carrito").classList.remove("abierto");
  $("#carrito").setAttribute("aria-hidden", "true");
  $("#velo").classList.remove("abierto");
  document.body.classList.remove("carrito-abierto");
  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}

export function iniciarCarrito(lista) {
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

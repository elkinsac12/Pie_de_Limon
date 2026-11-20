# Landing Pie de Limón

Proyecto estático (HTML + CSS + JavaScript). Sin build ni dependencias. **Este ZIP no incluye imágenes**:
el código ya apunta a ellas por nombre y tú solo las copias en su carpeta.

Estructura inspirada en elmolino.com.co: encabezado con logo, inicio, bloques de valor, categorías con íconos,
catálogo por pestañas con tarjetas (foto, nombre, precio y botón **+**), contacto, WhatsApp flotante y pie con redes.
Se conserva el pedido por WhatsApp de la landing 0808 Café. Fondo blanco y colores tomados del logo.

## 1. Ejecutar en local

Necesita un servidor local (la página lee `data/productos.json`):

```bash
python -m http.server 5500      # o:  node server.mjs
```

Abre http://localhost:5500 (con la extensión Live Server de VS Code también funciona).

## 2. Poner tus imágenes

| Qué | Dónde | Nombre del archivo |
|---|---|---|
| Logo | `assets/img/` | `Logo.jpeg` |
| Fotos (17 productos + `Varios` + `Todos los productos`) | `assets/img/productos/` | el que diga el campo `imagen` de cada producto en `data/productos.json` |

El nombre debe ser **idéntico**, con mayúsculas, minúsculas y extensión (`Producto1.JPEG` no es lo mismo que `Producto1.jpeg`).
Mientras una foto no esté en la carpeta, la tarjeta muestra una imagen de respaldo ("Foto pendiente").

Hoy el código apunta a tus archivos reales: `Producto1.JPEG` … `Producto17.JPEG` y `Varios.JPEG` (productos del catálogo),
y `Todos los productos.JPEG` (foto grande del inicio, ver `HERO_IMAGEN` en `assets/js/config.js`).

Consejo: si las fotos pesan mucho, redúcelas a unos 1200 px de ancho antes de copiarlas; la página cargará más rápido.

## 3. Completar el catálogo (`data/productos.json`)

```json
{
  "id": "brownie",                 // único, sin espacios ni tildes
  "nombre": "Brownie",
  "categoria": "brownies",         // debe existir en CATEGORIAS de config.js
  "precio": 8500,                  // número sin puntos, o null para mostrar "Consultar"
  "imagen": "Producto5.JPEG",       // nombre exacto del archivo en assets/img/productos/
  "descripcion": "Brownie de chocolate, húmedo por dentro."
}
```

Los productos están como "Producto 1"… con categoría `postres` y sin precio: reemplaza nombre, descripción, categoría y precio por los reales. Cuando haya 2 o más categorías con productos, aparecen automáticamente los íconos de categorías y las pestañas.

## 4. Otros ajustes (`assets/js/config.js`)

- `WHATSAPP`: **cámbialo** (hoy es el número de ejemplo `573000000000`; formato 57 + número, sin `+` ni espacios).
- `INSTAGRAM` y `FACEBOOK`: ya apuntan a tus perfiles.
- `CATEGORIAS`: id, nombre e ícono de cada categoría. Una categoría solo aparece si tiene productos.
- `VALORES`: los 3 bloques bajo el inicio (textos de ejemplo).
- `HERO_IMAGEN`: la foto grande del inicio (nombre de archivo en `assets/img/productos/`).

Textos del inicio y del contacto: `index.html`. Colores: variables al inicio de `assets/css/estilos.css`.

## 5. Pedido por WhatsApp

El botón **+** agrega el producto al pedido. El botón verde flotante muestra la cantidad y abre el pedido; allí el cliente elige
domicilio o recoger, deja sus datos y envía el mensaje armado por WhatsApp. Los productos sin precio se envían como
"precio por confirmar". El botón "Tu pedido" del encabezado está comentado en `index.html` (busca `BOTÓN "TU PEDIDO" OCULTO`).

## Estructura

```
index.html
server.mjs  package.json
data/productos.json
assets/
  css/estilos.css
  img/            <- Logo.jpeg
  img/productos/  <- las 19 fotos
  js/  main.js  config.js  catalogo.js  carrito.js  util.js
```

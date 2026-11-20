/* =====================================================
   CONFIGURACIÓN — edita aquí tus datos de contacto y textos
   Los productos están en data/productos.json
   ===================================================== */
export const NEGOCIO = "Pie de Limón";
export const WHATSAPP = "573000000000";   // <-- CAMBIAR: 57 + tu número, sin + ni espacios
export const INSTAGRAM = "https://www.instagram.com/piedelimon.co/";
export const FACEBOOK = "https://www.facebook.com/profile.php?id=61558098209943";

// Categorías del catálogo. "id" es el que va en el campo "categoria" de productos.json
export const CATEGORIAS = [
  { id: "pies", nombre: "Pies", icono: "🥧" },
  { id: "minis", nombre: "Minis", icono: "🍰" },
  { id: "brownies", nombre: "Brownies", icono: "🍫" },
  { id: "postres", nombre: "Postres", icono: "🍮" }
];

// Bloques de valor bajo el inicio (textos de ejemplo, cámbialos por los tuyos)
export const VALORES = [
  { icono: "🤲", titulo: "Hecho a mano", texto: "Cada postre se prepara de forma artesanal, en pequeñas tandas." },
  { icono: "🍋", titulo: "Sabor y frescura", texto: "Ingredientes frescos y recetas con el punto justo de dulce y cítrico." },
  { icono: "📅", titulo: "Por encargo", texto: "Cuéntanos tu fecha y lo tenemos listo para tu ocasión." }
];

// Foto grande del inicio: nombre del archivo dentro de assets/img/productos/
export const HERO_IMAGEN = "Todos los productos.JPEG";

export const ENTREGAS = ["Domicilio", "Recoger"];
export const MAX_POR_LINEA = 20;

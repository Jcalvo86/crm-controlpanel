/**
 * GLOSAURIO CMS — module-registry.js
 *
 * Catálogo central de módulos y schemas de datos del CMS.
 * Permite que las vistas de lista y de edición se autogeneren dinámicamente
 * a partir de la definición de campos de cada módulo.
 */

window.Glosaurio = window.Glosaurio || {};

window.Glosaurio.CMS_MODULES = {
  // ── 📚 MÓDULO TÉRMINOS / GLOSARIO ────────────────────────────
  terms: {
    id: 'terms',
    label: 'Términos / Glosario',
    icon: 'menu_book',
    description: 'Gestiona los conceptos, metodologías y prompts del glosario.',
    collection: 'terms',
    titleField: 'title', // campo representativo para títulos
    schema: [
      { id: 'title', label: 'Título del Término', type: 'text', required: true, placeholder: 'Ej: Vibe Coding Essentials' },
      {
        id: 'category',
        label: 'Categoría',
        type: 'dynamic-select',
        required: true
      },
      { id: 'description', label: 'Descripción Corta', type: 'textarea', required: true, rows: 3, placeholder: 'Descripción concisa para la tarjeta...' },
      { id: 'videoUrl', label: 'Enlace a Video (URL)', type: 'url', placeholder: 'Ej: https://www.youtube.com/watch?v=...' },
      {
        id: 'steps',
        label: 'Proceso Paso a Paso',
        type: 'steps', // tipo especial para colecciones estructuradas de pasos
        placeholderTitle: 'Título del paso',
        placeholderDetail: 'Descripción del paso...'
      },
      { id: 'problems', label: 'Problemas que Resuelve', type: 'lines', placeholder: 'Un problema por línea...' },
      { id: 'benefits', label: 'Beneficios Clave', type: 'lines', placeholder: 'Un beneficio por línea...' },
      { id: 'results', label: 'Entregables Esperados', type: 'textarea', rows: 2, placeholder: '¿Qué entregable se obtiene?' },
      { id: 'metrics', label: 'Métricas de Éxito', type: 'textarea', rows: 2, placeholder: '¿Cómo se mide el éxito?' },
      { id: 'tools', label: 'Herramientas Asociadas', type: 'tags', placeholder: 'Separadas por coma. Ej: Figma, VS Code' },
      { id: 'promptVars', label: 'Variables del Prompt', type: 'tags', placeholder: 'Variables entre corchetes. Ej: marca, sector' },
      { id: 'prompt', label: 'Prompt Template', type: 'code', placeholder: 'Actúa como experto en...' },
      { id: 'isDraft', label: 'Estado de Borrador', type: 'boolean', default: true }
    ]
  },

  // ── 📝 MÓDULO BLOG / POSTS ────────────────────────────────────
  blog: {
    id: 'blog',
    label: 'Blog / Artículos',
    icon: 'edit_note',
    description: 'Escribe y gestiona los artículos de noticias, tutoriales o posts.',
    collection: 'cms_posts',
    titleField: 'title',
    schema: [
      { id: 'title', label: 'Título del Post', type: 'text', required: true, placeholder: 'Ej: Cómo dominar Cursor en 2026' },
      { id: 'slug', label: 'Slug / URL', type: 'text', required: true, placeholder: 'Ej: dominar-cursor-2026' },
      { id: 'author', label: 'Autor', type: 'text', required: true, placeholder: 'Ej: Andrea Calvo' },
      {
        id: 'category',
        label: 'Categoría',
        type: 'dynamic-select',
        required: true
      },
      { id: 'summary', label: 'Resumen o Extracto', type: 'textarea', required: true, rows: 2, placeholder: 'Breve texto introductorio...' },
      { id: 'content', label: 'Contenido del Artículo', type: 'markdown', placeholder: 'Escribe tu post usando formato Markdown...' },
      { id: 'coverImage', label: 'Imagen de Portada (URL)', type: 'text', placeholder: 'https://ejemplo.com/imagen.jpg' },
      { id: 'tags', label: 'Etiquetas', type: 'tags', placeholder: 'Ej: ai, dev, ui' },
      { id: 'readTime', label: 'Tiempo de lectura (min)', type: 'number', placeholder: 'Ej: 5' },
      { id: 'isDraft', label: 'Estado de Borrador', type: 'boolean', default: true }
    ]
  },

  // ── 🛍️ MÓDULO PRODUCTOS ───────────────────────────────────────
  products: {
    id: 'products',
    label: 'Viajes / Productos',
    icon: 'travel_explore',
    description: 'Catálogo dinámico de viajes, itinerarios, precios y destinos.',
    collection: 'cms_products',
    titleField: 'name',
    schema: [
      { id: 'name', label: 'Nombre del Viaje', type: 'text', required: true, placeholder: 'Ej: Egipto: El Legado de los Faraones' },
      { id: 'subtitle', label: 'Subtítulo / Lema', type: 'text', placeholder: 'Ej: Un viaje de 10 días a través del tiempo...' },
      { id: 'sku', label: 'Código SKU / Identificador', type: 'text', required: true, placeholder: 'Ej: EGI-LEGADO-10D' },
      { id: 'price', label: 'Precio base', type: 'number', required: true, placeholder: 'Ej: 2990' },
      { id: 'comparePrice', label: 'Precio Anterior (Oferta)', type: 'number', placeholder: 'Ej: 3490' },
      { id: 'imageUrl', label: 'Imagen de Portada (URL)', type: 'text', placeholder: 'https://ejemplo.com/portada.jpg' },
      { id: 'overview', label: 'Descripción general (La Magia del Destino)', type: 'textarea', rows: 4, placeholder: 'Egipto no es solo un destino; es un portal...' },
      { id: 'duration', label: 'Duración (Días)', type: 'number', placeholder: 'Ej: 10' },
      { id: 'itineraryJson', label: 'Itinerario JSON', type: 'textarea', rows: 6, placeholder: '[\n  {"day": "Día 01", "title": "Llegada", "desc": "Detalle...", "info": "Mena House"}\n]' },
      { id: 'bestSeason', label: 'Mejor Época', type: 'text', placeholder: 'Ej: Octubre a Abril' },
      { id: 'currency', label: 'Moneda y Pagos', type: 'text', placeholder: 'Ej: Libra Egipcia (EGP) y Tarjetas' },
      { id: 'visa', label: 'Visado', type: 'text', placeholder: 'Ej: Visa gestionada a la llegada' },
      { id: 'mapUrl', label: 'URL de Imagen de Mapa', type: 'text', placeholder: 'https://ejemplo.com/mapa.jpg' },
      { id: 'galleryUrls', label: 'Galería de fotos (Una URL por línea)', type: 'lines', placeholder: 'https://ejemplo.com/foto1.jpg' },
      {
        id: 'status',
        label: 'Estado de Disponibilidad',
        type: 'select',
        required: true,
        options: [
          { value: 'active', label: '🟢 Activo / Visible' },
          { value: 'hidden', label: '⚪ Oculto' }
        ]
      },
      { id: 'isDraft', label: 'Borrador', type: 'boolean', default: true }
    ]
  },

  // ── 🎨 MÓDULO DESIGN TOKENS ───────────────────────────────────
  design_tokens: {
    id: 'design_tokens',
    label: 'Design Tokens / Marca',
    icon: 'palette',
    description: 'Gestiona la paleta de colores, tipografías y logos SVG de tus marcas.',
    collection: 'design_tokens',
    titleField: 'brandName',
    schema: [
      { id: 'brandName', label: 'Nombre de la Marca', type: 'text', required: true, placeholder: 'Ej: Glosaurio, Nike' },
      { id: 'colors', label: 'Colores', type: 'json' },
      { id: 'typographies', label: 'Tipografías', type: 'json' },
      { id: 'logos', label: 'Logos SVG', type: 'json' },
      { id: 'isDraft', label: 'Borrador', type: 'boolean', default: true }
    ]
  }
};

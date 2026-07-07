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
      { id: 'vibeScore', label: 'Vibe Score', type: 'range', min: 1, max: 10, default: 7 },
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
    label: 'Productos / Servicios',
    icon: 'inventory_2',
    description: 'Catálogo dinámico de artículos, precios, descripciones y stock.',
    collection: 'cms_products',
    titleField: 'name',
    schema: [
      { id: 'name', label: 'Nombre del Producto', type: 'text', required: true, placeholder: 'Ej: Suscripción Anual AI Partner' },
      { id: 'sku', label: 'Código SKU / Identificador', type: 'text', required: true, placeholder: 'Ej: AI-PRO-ANNUAL' },
      { id: 'price', label: 'Precio', type: 'number', required: true, placeholder: 'Ej: 99.99' },
      { id: 'comparePrice', label: 'Precio Anterior (Oferta)', type: 'number', placeholder: 'Ej: 149.99' },
      { id: 'description', label: 'Descripción detallada', type: 'textarea', rows: 4, placeholder: 'Detalles técnicos, características...' },
      {
        id: 'status',
        label: 'Estado de Disponibilidad',
        type: 'select',
        required: true,
        options: [
          { value: 'active', label: '🟢 Activo / Visible' },
          { value: 'outOfStock', label: '🔴 Sin Stock' },
          { value: 'hidden', label: '⚪ Oculto' }
        ]
      },
      { id: 'stock', label: 'Stock Disponible', type: 'number', placeholder: 'Ej: 150' },
      { id: 'imageUrl', label: 'Imagen del Producto (URL)', type: 'text', placeholder: 'https://ejemplo.com/producto.jpg' },
      { id: 'features', label: 'Características destacadas', type: 'lines', placeholder: 'Una ventaja/característica por línea...' },
      { id: 'isDraft', label: 'Borrador', type: 'boolean', default: true }
    ]
  }
};

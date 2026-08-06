# Design System Specification: Dashboard Forms & Density Optimization

## 1. Visión General
El objetivo de esta especificación es incrementar la densidad de información, mejorar la jerarquía visual y optimizar la usabilidad del Control Panel (CRM / CMS). Se sustituyen los elementos de landing page (inputs sobredimensionados, paddings pesados, radios pronunciados) por una interfaz de alta densidad profesional (*Compact/Dense UI*).

---

## 2. Token de Diseño & Sistema de Superficies

### 2.1. Paleta de Superficies (Layered Surfaces)
- **Page Background (Canvas):** `#F8FAFC` (Slate 50)
- **Container / Card Background:** `#FFFFFF` (White)
- **Container Border:** `1px solid #E2E8F0` (Slate 200)
- **Input Background (Default):** `#FFFFFF` (White) — *Eliminar fondos grises/plomizos dentro de los inputs.*
- **Input Background (Hover):** `#F8FAFC` (Slate 50)
- **Input Border (Default):** `1px solid #E2E8F0` (Slate 200)
- **Input Border (Focus):** `1px solid #3B82F6` (Blue 500) con `ring-2 ring-blue-500/20`

### 2.2. Dimensiones y Geometría (Sizing & Radii)
- **Input Height (Standard):** `38px` (`h-9.5` o `h-9` de 36px a 38px máximo).
- **Textarea Min-Height:** `96px` (`min-h-[24rem]` ajustado a demanda).
- **Border Radius:** `6px` a `8px` (`rounded-md` o `rounded-lg`). *Prohibido usar radios mayores a 10px en inputs y selects.*
- **Internal Padding:** `px-3 py-2` (Horizontal: 12px, Vertical: 8px).

---

## 3. Tipografía y Jerarquía Form-Label

### 3.1. Labels (Etiquetas de Campo)
- **Font Size:** `12px` - `13px` (`text-xs` o `text-[13px]`).
- **Font Weight:** `600` (`font-semibold`).
- **Color:** `#334155` (Slate 700).
- **Margin Bottom / Gap:** `6px` (`gap-1.5` en flex container vertical).
- **Required Marker (*):** `#EF4444` (Red 500) con margen izquierdo de `2px`.

### 3.2. Input Text & Placeholders
- **Input Text:** `14px` (`text-sm`), Weight `400` / `500`, Color `#0F172A` (Slate 900).
- **Placeholder:** Color `#94A3B8` (Slate 400), Font Weight `400`.

---

## 4. Reglas de Layout & Layout Grid

### 4.1. Estructura Multicolumna
- Los campos de selección corta (`select`), fechas, números o categorías relativas DEBEN agruparse en grids de **2 o 3 columnas** para evitar el desperdicio de espacio horizontal.
- **Tailwind Class:** `grid grid-cols-1 md:grid-cols-2 gap-4`

### 4.2. Grupos de Input Acoplados (Input Groups)
- Cuando un input requiera una acción inmediata (ej. campo *Resultado Objetivo* + botón *Añadir*), el botón DEBE acoplarse físicamente al input formando una sola unidad visual.
- **Estructura HTML:**
  ```html
  <div class="flex rounded-md shadow-sm">
    <input type="text" class="h-9 flex-1 rounded-l-md border border-r-0 border-slate-200 px-3 text-sm focus:outline-none focus:border-blue-500" placeholder="..." />
    <button type="button" class="h-9 px-3.5 rounded-r-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
      Añadir
    </button>
  </div>
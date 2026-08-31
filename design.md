# Control Panel Design Guidelines (design.md)

Este documento centraliza los estándares de diseño y estructura para el **Control Panel** de Sueño Travel. Se basa en las fundaciones de diseño (`DESIGN.md`), las guías de layout (`layout-control-panel.md`), los patrones de UI (`ui-patterns.md`), y los principios base (`design-foundations.md`).

## 1. Densidad y Layout
- **Estructura Base:** El Control Panel utiliza un diseño compacto de alta densidad (High-Density Data Interface).
- **Alturas:** 
  - Inputs / Selects: `36px` a `38px` (`h-9`).
  - Botones de acción en tabla: `32px` (`h-8`).
  - Botones superiores / Toolbar: `36px` a `38px`.
  - Textarea: Mínimo `96px` (`min-h-[24rem]` o `min-h-[96px]`).
- **Border Radius:**
  - Contenedores y Tarjetas: `8px` a `12px` (`rounded-lg`, `rounded-xl`).
  - Inputs y Botones: `6px` a `8px` (`rounded-md`). Nunca usar más de `10px` en controles de formulario.
- **Espaciado:** Sistema base-4. Paddings y margins en múltiplos de 4px (`4`, `8`, `12`, `16`, `24`, `32`, etc.).

## 2. Formularios y Grillas
- **Multi-Columna:** Campos cortos (fechas, selectores, estados) deben agruparse en grillas (ej. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Estructuras Anidadas:** Usar patrón de 3 columnas: Columna izquierda (span 4) para contexto, columnas derechas (span 8) para elementos hijos vinculados por línea vertical (`border-l border-[var(--outline-variant)]`).
- **Labels:** Fuente de `12px` o `13px` semi-bold (`text-xs font-semibold`), ubicados arriba del input con separación de `6px` (`space-y-1.5`).
- **Asterisco Requerido:** En rojo después del label.
- **Botones Acoplados:** Botones relacionados con un input (ej. Buscar) deben unirse visualmente usando un contenedor flex y redondeo parcial (`rounded-l-md` / `rounded-r-md`).
- **Listas Dinámicas:**
  - Botones "Añadir" siempre al final de la lista.
  - Botón "Eliminar" de elemento corto (X) va dentro del input (`relative`, padding derecho).
  - Acciones destructivas para tarjetas enteras: botón flotante arriba a la derecha.

## 3. Tablas e Información (ItemsTable)
- **Alturas de fila:** Compactas (`44px` a `48px`).
- **Alineación:**
  - Izquierda: Textos, Nombres, Categorías.
  - Centro/Izquierda: Fechas, Badges de Estado.
  - Derecha (Tabular): Números y Moneda (`text-right tabular-nums`).
- **Columna de Acciones:** Alineada a la derecha. Acciones primarias usan botón de `32px`. Secundarias en dropdown `...`.
- **Píldoras Jerárquicas:** Para metadatos en tablas, destacar el contenedor en negrita seguido de los hijos (ej. **Egipto** (Cairo, Luxor)).

## 4. Estructura de Página (Shell)
Cada vista principal debe usar:
1. **Sidebar:** A la izquierda.
2. **Top Bar:** Breadcrumbs y acciones globales.
3. **KPI Grid:** Resumen superior (1, 2 o 4 columnas, fuente `20px` a `24px` bold).
4. **Main Content:** Tablas, filtros y formularios en la zona central.

## 5. Acordeones y Autocompletado
- **Acordeones Inteligentes:** Usa transiciones CSS Grid (`grid-template-rows: 0fr -> 1fr`). Inician colapsados. Al añadir nuevo, se expande sólo el nuevo.
- **Autocompletado:** Preferir `<datalist>` HTML5 para inputs que requieran opciones rápidas sin bloquear texto libre.

## 6. Accesibilidad
- **Hitbox Táctil:** El área interactiva (hitbox) de botones, iconos y enlaces debe ser de al menos **44x44px**, incluso si el elemento visual es menor.

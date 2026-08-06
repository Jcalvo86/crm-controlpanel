# Crear el archivo rules.md dentro de la carpeta del submódulo 'controlpanel'
@"
# Estándares de Diseño y Usabilidad — CRM Control Panel

Estas reglas describen las decisiones de UI/UX estándar que deben aplicarse a todos los módulos, formularios y componentes interactivos creados para el Control Panel.

## 1. Diseño de Formularios Dinámicos y Complejos

- **Patrón de 3 Columnas para Estructuras Anidadas:**
  Para campos donde se definen entidades principales y sub-entidades (por ejemplo: *Países y sus Ciudades*, *Ciudades y sus Hoteles*, *Secciones y Contenidos*), utiliza una distribución en rejilla:
  - Columna Izquierda (span 4): Contenedor o contexto principal.
  - Columnas Derechas (span 8): Lista de elementos hijos vinculados con una línea divisoria vertical sutil (`border-l border-[var(--outline-variant)]`).
  
- **Botón de Cierre/Eliminación Integrado en el Input:**
  Para listados dinámicos simples donde cada línea cuenta con un botón para removerla (como variables, ciudades, u hoteles alternativos), el botón de remover (`close`) se posiciona **dentro del input**, en el extremo derecho (utilizando contenedores `relative` y un padding-right de `32px` en el input).

- **Ubicación de Botones "Añadir":**
  Los botones para agregar elementos a una lista dinámica (e.g. *Añadir Ciudad*, *Añadir Actividad*, *Añadir Hotel*, *Añadir Variable*) deben ir **siempre en la parte inferior** de su respectivo listado. No se deben colocar en las cabeceras o etiquetas superiores para mantener el orden de lectura vertical.

- **Botones de Acción Destructiva Flotantes:**
  Los botones de eliminación global para tarjetas o secciones grandes deben ubicarse en la **esquina superior derecha** de la tarjeta (`absolute top-4 right-4`).
  Se utiliza el botón circular tipo icono con el símbolo de basurero (`delete`) y la acción destructiva controlada `HoldToConfirmButton` (retardo de confirmación de 2 segundos mediante presión continua).

## 2. Autocompletados Híbridos (Inputs Autocompletables)

- **Tecnología Datatalist:**
  Utiliza elementos estándar **HTML5 <datalist>** enlazados mediante el atributo `list` en los inputs de texto para permitir sugerencias rápidas (como el régimen hotelero, momentos de actividades o categorías) sin bloquear la escritura libre de valores personalizados.

## 3. Acordeones Colapsables Inteligentes

- **Transición de Altura:**
  Los bloques extensos se presentan en acordeones animados con transiciones de CSS Grid (`grid-template-rows: 0fr -> 1fr`).
- **Comportamiento Dinámico:**
  Al abrir un registro existente inician colapsados para limpieza visual. Al crear un nuevo elemento en la lista, colapsa de inmediato los anteriores y expande de forma automática únicamente el nuevo elemento creado para agilizar el ingreso de datos.

## 4. Visualización en Tablas (ItemsTable)

- **Píldoras de Ubicación/Metadatos:**
  La visualización de registros dinámicos y agrupados en la tabla principal debe utilizar píldoras compactas (`chip`) con formato jerárquico que destaquen primero el contenedor principal en negrita y a continuación los sub-elementos entre paréntesis (ej: **Egipto** (El Cairo, Luxor)).
"@ | Out-File -FilePath "controlpanel\rules.md" -Encoding utf8

---
name: glossary-term-generator
description: Genera objetos JSON estructurados para el glosario/diccionario técnico del proyecto, redactados en un lenguaje simplificado y orientado a UX/Producto.
---

# Skill: Glossary Term Generator

## Propósito
Generar entradas JSON para el glosario de la plataforma a partir de un término, tecnología, metodología o concepto solicitado. Toda la redacción debe explicarse de forma clara, conceptual y comprensible para perfiles no desarrolladores (UX designers, product managers, stakeholders).

## Reglas de Redacción
1. **Tono y Lenguaje:** Evitar la jerga técnica excesivamente densa. Explicar el "qué es" y el "para qué sirve" priorizando el impacto en producto, la experiencia de usuario y la integridad del sistema.
2. **Estructura JSON:** Mantener exactamente la estructura de campos del esquema oficial sin omitir ninguna propiedad.
3. **Categorías Válidas:** El campo `category` DEBE ser exactamente una de estas opciones:
   - `'Diseño & Marca'`
   - `'Vibe Coding'`
   - `'Tech'`
   - `'Gestión de Proyectos'`
   - `'Automatización'`
4. **Ejemplo Técnico:** Mantenerlo breve, conceptual o pseudo-código comentado si facilita la comprensión visual de cómo opera el concepto.

## Plantilla Base del Esquema JSON

```json
[
  {
    "title": "[Nombre exacto del término]",
    "category": "[Categoría válida]",
    "description": "[Explicación clara de qué es y su propósito principal sin jerga técnica opaca.]",
    "steps": [
      {
        "label": "1. [Nombre del paso 1]",
        "detail": "[Explicación del paso en lenguaje sencillo.]"
      },
      {
        "label": "2. [Nombre del paso 2]",
        "detail": "[Explicación del paso en lenguaje sencillo.]"
      }
    ],
    "problems": [
      "[Problema o ineficiencia número 1 que resuelve]",
      "[Problema o ineficiencia número 2 que resuelve]"
    ],
    "benefits": [
      "[Beneficio principal 1 para el producto o equipo]",
      "[Beneficio principal 2 para el producto o equipo]"
    ],
    "tools": [
      "[Herramienta relacionada 1]",
      "[Herramienta relacionada 2]"
    ],
    "results": "[Descripción del resultado tangible o estado esperado en el proyecto.]",
    "metrics": "[Indicadores de éxito o impacto esperado en el proyecto.]",
    "recommendedScenarios": [
      "[Caso de uso ideal 1]",
      "[Caso de uso ideal 2]"
    ],
    "criticalExclusions": [
      "[Escenario donde NO se aconseja su uso 1]",
      "[Escenario donde NO se aconseja su uso 2]"
    ],
    "technicalExample": "[Ejemplo visual, pseudocódigo o fragmento simple de uso]",
    "prompt": "[Prompt útil para consultar sobre este concepto a una IA con variables [nombre_variable]]",
    "promptVars": [
      "nombre_variable"
    ],
    "isDraft": true
  }
]
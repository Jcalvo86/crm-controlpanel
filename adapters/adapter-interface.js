/**
 * GLOSAURIO — adapter-interface.js
 *
 * Define el contrato (interfaz) que todos los adapters deben cumplir.
 * Incluye la implementación fallback con localStorage.
 *
 * Contrato del Adapter:
 *   getTerms(filters?)  → Promise<Term[]>
 *   getTerm(id)         → Promise<Term|null>
 *   createTerm(data)    → Promise<Term>
 *   updateTerm(id,data) → Promise<Term>
 *   deleteTerm(id)      → Promise<void>
 *   seedTerms(terms[])  → Promise<Term[]>
 *   testConnection()    → Promise<{ ok: boolean, message: string }>
 */

window.Glosaurio = window.Glosaurio || {};

// ─────────────────────────────────────────────────────────────
//  SEED DATA (shared between adapters)
// ─────────────────────────────────────────────────────────────
window.Glosaurio.SEED_TERMS = [
  {
    id: 'design-sprint',
    title: 'Design Sprint',
    category: '{"workArea":"diseño","contentType":"metodologia","targetResult":"crear_marca"}',
    description: 'Metodología de cinco días para resolver problemas críticos de negocio mediante diseño, prototipado y testeo de usuarios reales.',
    steps: [
      { label: 'Map & Understand', detail: 'Mapear el problema y establecer el objetivo a largo plazo. Identificar los actores clave del proceso.' },
      { label: 'Sketch & Ideate', detail: 'Cada miembro del equipo esboza soluciones de forma individual usando el método "Crazy 8s".' },
      { label: 'Decide', detail: 'El equipo vota la mejor solución usando el método del punto de pegatina.' },
      { label: 'Prototype', detail: 'Crear un prototipo realista de la solución seleccionada en Figma o papel.' },
      { label: 'Test', detail: 'Testear con 5 usuarios reales y documentar aprendizajes.' },
    ],
    problems: ['Decisiones de diseño lentas y costosas', 'Ciclos de feedback demasiado largos', 'Falta de alineación del equipo en el problema'],
    benefits: ['Reduce semanas de trabajo a 5 días', 'Valida ideas antes de implementarlas', 'Genera consenso rápido en equipos'],
    tools: ['Figma', 'Notion', 'Miro'],
    results: 'Un prototipo validado con usuarios reales y un informe de aprendizajes accionables.',
    metrics: 'Número de insights (mínimo 3 críticos). NPS del prototipo.',
    promptVars: ['nombre_producto', 'problema_central', 'audiencia'],
    prompt: `Actúa como facilitador experto de Design Sprint de Google Ventures.\n\nProducto: **[nombre_producto]**\nProblema: **[problema_central]**\nAudiencia: **[audiencia]**\n\nGenera el plan completo del sprint de 5 días.`,
    vibeScore: 6,
    isDraft: false
  },
  {
    id: 'cursor-ai-workflow',
    title: 'Cursor AI Workflow',
    category: '{"workArea":"codigo","contentType":"herramienta","targetResult":"reducir_tokens"}',
    description: 'Optimización extrema del flujo de desarrollo utilizando Composer, Cursor Rules y las capacidades nativas de AI en el editor.',
    steps: [
      { label: 'Setup & Rules', detail: 'Configurar `.cursorrules` con las convenciones del proyecto.' },
      { label: 'Composer Workflow', detail: 'Usar Composer para tareas multi-archivo. Describe el objetivo completo.' },
      { label: 'Context Injection', detail: 'Usar @-mentions para dar contexto preciso: @file, @docs, @web.' },
      { label: 'Review & Iterate', detail: 'Revisar siempre el diff antes de aceptar. Iterar con feedback preciso.' },
    ],
    problems: ['Velocidad de desarrollo limitada', 'Inconsistencias de estilo entre archivos'],
    benefits: ['3-10x velocidad de desarrollo', 'Consistencia de código garantizada por rules'],
    tools: ['Cursor', 'VS Code', 'Claude', 'Gemini'],
    results: 'Features complejas implementadas en horas. Base de código consistente.',
    metrics: 'Líneas de código generadas por hora. Ratio de aceptación de sugerencias.',
    promptVars: ['nombre_proyecto', 'stack_tecnologico', 'convenciones'],
    prompt: `Actúa como senior engineer especializado en [stack_tecnologico].\n\nProyecto: **[nombre_proyecto]**\nConvenciones: **[convenciones]**\n\nGenera el archivo .cursorrules completo.`,
    vibeScore: 10,
    isDraft: false
  },
  {
    id: 'brand-voice-guide',
    title: 'Brand Voice Guide',
    category: '{"workArea":"diseño","contentType":"metodologia","targetResult":"crear_marca"}',
    description: 'Framework para definir la personalidad lingüística de una marca y su aplicación en interfaces conversacionales y comunicación digital.',
    steps: [
      { label: 'Audit de Voz', detail: 'Recopilar ejemplos de comunicación existente y mapear atributos de personalidad.' },
      { label: 'Arquetipos', detail: 'Usar los 12 arquetipos de Jung para posicionar la marca.' },
      { label: 'Vocabulary Chart', detail: 'Crear el glosario de palabras permitidas y prohibidas por canal.' },
      { label: 'Apply to Touchpoints', detail: 'Implementar en: UI copy, emails, redes sociales y AI/chatbot.' },
    ],
    problems: ['Comunicación inconsistente entre canales', 'Copy genérico sin personalidad'],
    benefits: ['Reconocimiento de marca instantáneo', 'Velocidad de producción de contenido'],
    tools: ['Notion', 'Figma', 'ChatGPT'],
    results: 'Manual de voz de marca con ejemplos concretos por canal.',
    metrics: 'Coherencia de tono (auditoría mensual). Tiempo de aprobación de copy.',
    promptVars: ['nombre_marca', 'sector', 'arquetipo_jungiano'],
    prompt: `Actúa como estratega de marca y copywriter senior.\n\nMarca: **[nombre_marca]**\nSector: **[sector]**\nArquetipo: **[arquetipo_jungiano]**\n\nGenera un Brand Voice Guide completo.`,
    vibeScore: 7,
    isDraft: false
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    category: '{"workArea":"codigo","contentType":"herramienta","targetResult":"no_parezca_ai"}',
    description: 'Arte y ciencia de diseñar instrucciones precisas para LLMs que maximizan la calidad y consistencia de las respuestas generadas.',
    steps: [
      { label: 'Define Objective', detail: 'Especificar el output deseado con ejemplos concretos.' },
      { label: 'Chain of Thought', detail: 'Pedir al modelo que razone paso a paso.' },
      { label: 'Few-Shot Examples', detail: 'Proveer 2-3 ejemplos del formato de respuesta esperado.' },
      { label: 'Test & Iterate', detail: 'Probar con 5+ casos. Documentar fallos y refinar.' },
    ],
    problems: ['Respuestas de AI inconsistentes', 'Outputs que no siguen el formato requerido'],
    benefits: ['Outputs predecibles de alta calidad', 'Templates reutilizables por el equipo'],
    tools: ['Claude', 'GPT-4', 'Gemini', 'LangChain'],
    results: 'Library de prompts validados. Reducción de iteraciones manuales en 60%.',
    metrics: 'Tasa de aceptación del primer output (target: 70%).',
    promptVars: ['tarea_objetivo', 'formato_output', 'ejemplo_ideal'],
    prompt: `Actúa como Prompt Engineer experto en LLMs.\n\nTarea: **[tarea_objetivo]**\nFormato: **[formato_output]**\nEjemplo ideal: **[ejemplo_ideal]**\n\nDiseña el prompt perfecto.`,
    vibeScore: 9,
    isDraft: false
  }
];

// ─────────────────────────────────────────────────────────────
//  LOCALSTORAGE ADAPTER (fallback offline)
// ─────────────────────────────────────────────────────────────
window.Glosaurio.LocalStorageAdapter = class LocalStorageAdapter {
  constructor() {
    this.provider = 'localStorage';
  }

  _getKey(collection) {
    return `glosaurio_${collection}`;
  }

  _ensureSeed(collection) {
    const key = this._getKey(collection);
    if (!localStorage.getItem(key)) {
      if (collection === 'terms') {
        localStorage.setItem(key, JSON.stringify(window.Glosaurio.SEED_TERMS));
      } else {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
  }

  _read(collection) {
    this._ensureSeed(collection);
    try {
      return JSON.parse(localStorage.getItem(this._getKey(collection))) || [];
    } catch { return []; }
  }

  _write(collection, items) {
    localStorage.setItem(this._getKey(collection), JSON.stringify(items));
  }

  // ── Generic Dynamic Methods ───────────────────────────────
  async getItems(collection, filters = {}) {
    let items = this._read(collection);
    if (filters.published) items = items.filter(t => !t.isDraft);
    if (filters.category)  items = items.filter(t => t.category === filters.category);
    return items;
  }

  async getItem(collection, id) {
    return this._read(collection).find(t => t.id === id) || null;
  }

  async createItem(collection, data) {
    const items = this._read(collection);
    const newItem = { ...data, id: data.id || `${collection}-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    items.unshift(newItem);
    this._write(collection, items);
    return newItem;
  }

  async updateItem(collection, id, data) {
    const items = this._read(collection);
    const idx = items.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Item ${id} not found in ${collection}`);
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    this._write(collection, items);
    return items[idx];
  }

  async deleteItem(collection, id) {
    const items = this._read(collection).filter(t => t.id !== id);
    this._write(collection, items);
  }

  // ── Backward Compatible Specific Methods ──────────────────
  async getTerms(filters = {}) {
    return this.getItems('terms', filters);
  }

  async getTerm(id) {
    return this.getItem('terms', id);
  }

  async createTerm(data) {
    return this.createItem('terms', data);
  }

  async updateTerm(id, data) {
    return this.updateItem('terms', id, data);
  }

  async deleteTerm(id) {
    return this.deleteItem('terms', id);
  }

  async seedTerms(terms) {
    this._write('terms', terms);
    return terms;
  }

  async testConnection(collection = 'terms') {
    return { ok: true, message: `LocalStorage disponible ✓ (colección: ${collection})` };
  }
};

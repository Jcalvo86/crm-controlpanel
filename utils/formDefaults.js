/**
 * Returns the default (empty) form state for the CRM editor.
 * Accepts resolved workAreas and contentTypes to seed taxonomy-dependent fields.
 *
 * @param {Array} workAreas  - e.g. [{ val: 'codigo', label: '...' }]
 * @param {Array} contentTypes - e.g. [{ val: 'metodologia', label: '...' }]
 * @returns {Object} emptyFormData
 */
export const createEmptyFormData = (workAreas = [], contentTypes = []) => ({
  // Shared identity
  title: '',
  category: 'Diseño & Marca',
  workArea: workAreas[0]?.val || 'codigo',
  contentType: contentTypes[0]?.val || 'metodologia',
  targetResult: 'otro',
  description: '',
  url: '',
  isDraft: false,

  // Terms / Concepts fields
  videos: [''],
  tools: [],
  prompt: '',
  problems: '',
  benefits: '',
  steps: [{ label: '', detail: '' }],
  results: '',
  metrics: '',
  promptVars: '',
  recommendedScenarios: '',
  criticalExclusions: '',
  technicalExample: '',

  // Design Tokens fields
  brandName: '',
  colors: [{ hex: '', role: '', description: '' }],
  typographies: [{ fontFamily: '', weights: [], fontSize: '', sampleText: '' }],
  logos: [{ name: '', svgContent: '' }],

  // Travel fields
  agency: 'Sueño Travel Chile',
  durationDays: 1,
  durationNights: 0,
  destinationsSummary: '',
  visaCostUSD: 0,
  hotelTaxUSD: 0,
  disclaimer: '',
  servicesIncludedEgypt: '',
  servicesIncludedTurkey: '',
  servicesExcluded: '',
  itinerary: [],
  servicesIncludedList: [],
  servicesExcludedList: [''],
  hotelsPlanned: [],

  // Legacy / unused fields kept for backward compat
  tokenName: '',
  tokenType: 'color',
  colorHex: '',
  colorRole: '',
  colorPaletteDescription: '',
  fontFamily: '',
  fontWeights: [],
  fontSize: '',
  fontSampleText: '',
  svgContent: ''
});

/**
 * Derives which optional panels/sections should be active and expanded
 * based on the data already stored in an item, for the given module.
 *
 * Returns { activePanels, expandedSections } ready to call setState with.
 *
 * @param {Object} item        - The record being edited
 * @param {string} activeModule - 'terms' | 'design_tokens' | 'travel'
 */
export const derivePanelsFromItem = (item, activeModule) => {
  if (activeModule === 'design_tokens') {
    const hasColor = !!(item.colors && item.colors.length > 0 && item.colors.some(c => (c.hex || '').trim() || (c.role || '').trim()));
    const hasTypography = !!(item.typographies && item.typographies.length > 0 && item.typographies.some(t => (t.fontFamily || '').trim()));
    const hasLogo = !!(item.logos && item.logos.length > 0 && item.logos.some(l => (l.name || '').trim() || (l.svgContent || '').trim()));

    const activePanels = {
      steps: false,
      problems: false,
      metrics: false,
      prompt: false,
      color: hasColor,
      typography: hasTypography,
      logo: hasLogo
    };
    const expandedSections = {
      identity: true,
      steps: false,
      problems: false,
      metrics: false,
      prompt: false,
      color: hasColor,
      typography: hasTypography,
      logo: hasLogo
    };
    return { activePanels, expandedSections };
  }

  // terms (and any future module)
  const hasSteps = !!(item.steps && item.steps.length > 0 && item.steps.some(s => (s.label || '').trim() || (s.detail || '').trim()));
  const hasProblems = !!((item.problems && item.problems.length > 0) || (item.benefits && item.benefits.length > 0));
  const hasMetrics = !!((item.results && item.results.trim()) || (item.metrics && item.metrics.trim()));
  const hasPrompt = !!(item.prompt && item.prompt.trim());
  const hasScenarios = !!((item.recommendedScenarios && item.recommendedScenarios.length > 0) || (item.criticalExclusions && item.criticalExclusions.length > 0));
  const hasCode = !!(item.technicalExample && item.technicalExample.trim());

  const activePanels = {
    steps: hasSteps,
    problems: hasProblems,
    metrics: hasMetrics,
    prompt: hasPrompt,
    scenarios: hasScenarios,
    code: hasCode,
    color: false,
    typography: false,
    logo: false
  };
  const expandedSections = {
    identity: true,
    steps: hasSteps,
    problems: hasProblems,
    metrics: hasMetrics,
    prompt: hasPrompt,
    scenarios: hasScenarios,
    code: hasCode,
    color: false,
    typography: false,
    logo: false
  };
  return { activePanels, expandedSections };
};

/**
 * Normalizes the config.taxonomies object into a consistent shape:
 * { [taxKey]: { label: string, items: Array } }
 *
 * Handles both the legacy flat shape (workAreas/contentTypes arrays)
 * and the newer nested shape (workArea.items / contentType.items).
 *
 * @param {Object} taxonomies - config.taxonomies
 * @returns {Object} normalizedTax
 */
export const normalizeTaxonomies = (taxonomies = {}) => {
  if (taxonomies.workAreas && !taxonomies.workArea) {
    return {
      workArea: { label: 'Áreas de Trabajo', items: taxonomies.workAreas },
      contentType: { label: 'Tipos de Contenido', items: taxonomies.contentTypes || [] }
    };
  }
  return taxonomies;
};

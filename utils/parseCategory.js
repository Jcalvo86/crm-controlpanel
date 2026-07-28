/**
 * Parses a category string (legacy string or JSON object) into a structured object.
 * @param {string} catStr
 * @returns {{ workArea: string, contentType: string, targetResult: string }}
 */
export const parseCategory = (catStr) => {
  try {
    if (catStr && catStr.startsWith('{') && catStr.endsWith('}')) {
      return JSON.parse(catStr);
    }
  } catch (e) { }

  const normalized = (catStr || '').trim();
  if (normalized === 'Diseño & Marca') return { workArea: 'diseño', contentType: 'metodologia', targetResult: 'crear_marca' };
  if (normalized === 'Vibe Coding') return { workArea: 'codigo', contentType: 'herramienta', targetResult: 'no_parezca_ai' };
  if (normalized === 'Gestión' || normalized === 'Gestión de Proyectos') return { workArea: 'gestion', contentType: 'metodologia', targetResult: 'otro' };
  if (normalized === 'Automatización') return { workArea: 'codigo', contentType: 'herramienta', targetResult: 'reducir_tokens' };
  if (normalized === 'Tech' || normalized === 'Tech & Tooling') return { workArea: 'codigo', contentType: 'herramienta', targetResult: 'otro' };

  return { workArea: 'codigo', contentType: 'metodologia', targetResult: 'otro' };
};

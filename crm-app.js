/**
 * GLOSAURIO CMS — crm-app.js
 *
 * Motor dinámico de CMS Headless.
 * Lee la configuración activa de DataSource, carga los módulos seleccionados
 * y genera de forma dinámica la interfaz del Workspace (tablas, formularios, filtros).
 * Soporta la creación y gestión dinámica de categorías por el usuario en la BD.
 */

// ─────────────────────────────────────────────────────────────
//  STATE & INITIAL CONFIG
// ─────────────────────────────────────────────────────────────
const CRM = {
  activeModule: null,    // módulo seleccionado ('terms', 'blog', 'products' o 'categories')
  activeModulesList: [], // lista de ids de módulos activos
  items: [],             // registros del módulo actual
  categories: [],        // categorías cargadas de la colección cms_categories
  editingId: null,       // id del registro que se edita
  activeTab: 'all',      // filtro actual ('all', 'published', 'draft')
  searchQuery: '',       // búsqueda por texto
  isDark: true,
  stepCount: 0           // contador especial para inputs compuestos (pasos)
};

// ─────────────────────────────────────────────────────────────
//  THEME
// ─────────────────────────────────────────────────────────────
CRM.isDark = document.documentElement.classList.contains('dark');

// ─────────────────────────────────────────────────────────────
//  VIEW NAVIGATION
// ─────────────────────────────────────────────────────────────
function showCRMList() {
  document.getElementById('crm-list-view')?.classList.remove('hidden');
  document.getElementById('crm-form-view')?.classList.add('hidden');
  document.getElementById('crm-categories-view')?.classList.add('hidden');
  document.getElementById('btn-download-template')?.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCRMForm(isNew = true) {
  document.getElementById('crm-list-view')?.classList.add('hidden');
  document.getElementById('crm-form-view')?.classList.remove('hidden');
  document.getElementById('crm-categories-view')?.classList.add('hidden');
  document.getElementById('btn-download-template')?.classList.remove('hidden');

  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const chip = document.getElementById('editor-mode-chip');
  if (chip) chip.textContent = isNew ? `Nuevo ${moduleDef.label.split('/')[0].trim()}` : 'Modo Edición';

  const lbl = document.getElementById('publish-label');
  if (lbl) lbl.textContent = isNew ? 'Publicar' : 'Actualizar';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCategoriesView() {
  CRM.activeModule = 'categories';
  CRM.editingId = null;

  document.getElementById('crm-list-view')?.classList.add('hidden');
  document.getElementById('crm-form-view')?.classList.add('hidden');
  document.getElementById('crm-categories-view')?.classList.remove('hidden');
  document.getElementById('btn-download-template')?.classList.add('hidden');

  // Actualizar título
  document.getElementById('workspace-title').textContent = 'Configuración de Categorías';
  document.getElementById('workspace-description').textContent = 'Crea y gestiona las categorías dinámicas para cada uno de los módulos de tu proyecto.';

  renderSidebarModules();
  populateCategoryFormModules();
  renderCategoriesTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────────────────────
//  SIDEBAR & MODULES ROUTING
// ─────────────────────────────────────────────────────────────
function renderSidebarModules() {
  const container = document.getElementById('cms-modules-nav');
  if (!container) return;

  const isConfigured = window.DataSourceConfig?.isConfigured();
  if (!isConfigured) {
    container.innerHTML = `
      <div class="text-xs p-4 text-center rounded-xl border border-dashed border-[var(--outline-variant)] text-[var(--outline)]">
        <span class="material-symbols-outlined block mb-1 text-lg">database_off</span>
        Base de datos sin configurar
      </div>
    `;
    return;
  }

  const cfg = window.DataSourceConfig.getConfig() || {};
  const defaultModules = Object.keys(window.Glosaurio.CMS_MODULES || {});
  CRM.activeModulesList = cfg.activeModules || defaultModules;

  let html = CRM.activeModulesList.map(modKey => {
    const m = window.Glosaurio.CMS_MODULES[modKey];
    if (!m) return '';
    const isActive = CRM.activeModule === modKey;
    const activeClass = isActive
      ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold'
      : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]';

    return `
      <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeClass}" data-module="${modKey}">
        <span class="material-symbols-outlined text-lg">${m.icon}</span>
        <span class="text-sm font-body-md">${m.label.split('/')[0].trim()}</span>
      </button>
    `;
  }).join('');

  // Agregar el botón especial de Configurar Categorías al final
  const isCatActive = CRM.activeModule === 'categories';
  const catActiveIdClass = isCatActive
    ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-semibold'
    : 'text-[var(--outline)] border border-dashed border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)]';

  html += `
    <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mt-4 ${catActiveIdClass}" id="btn-nav-categories">
      <span class="material-symbols-outlined text-lg">category</span>
      <span class="text-sm font-body-md">Configurar Categorías</span>
    </button>
  `;

  container.innerHTML = html;

  // Re-enlazar evento de categorías
  document.getElementById('btn-nav-categories')?.addEventListener('click', showCategoriesView);
}

function showUnconfiguredScreen() {
  document.getElementById('crm-list-view')?.classList.add('hidden');
  document.getElementById('crm-form-view')?.classList.add('hidden');
  document.getElementById('crm-categories-view')?.classList.add('hidden');
  
  const workspaceHeader = document.getElementById('workspace-title')?.parentElement?.parentElement;
  if (workspaceHeader) workspaceHeader.classList.add('hidden');

  document.getElementById('crm-unconfigured-view')?.classList.remove('hidden');
}

async function switchModule(moduleKey) {
  if (!window.Glosaurio.CMS_MODULES[moduleKey]) return;
  CRM.activeModule = moduleKey;
  CRM.editingId = null;

  renderSidebarModules();

  const moduleDef = window.Glosaurio.CMS_MODULES[moduleKey];
  document.getElementById('workspace-title').textContent = moduleDef.label;
  document.getElementById('workspace-description').textContent = moduleDef.description;

  // Actualizar etiquetas de botones
  const singleLabel = moduleDef.label.split('/')[0].trim();
  document.getElementById('btn-new-term-label').textContent = `Nuevo ${singleLabel}`;
  document.getElementById('btn-empty-new-label').textContent = `Nuevo ${singleLabel}`;

  // Configurar e inyectar campos del formulario
  buildFormForModule(moduleKey);

  // Volver a la lista
  showCRMList();

  // Cargar datos del módulo y recargar categorías globalmente
  await loadCategories();
  await loadItems();
}

// Escuchar clics en el menú lateral
document.getElementById('cms-modules-nav')?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-module]');
  if (btn) {
    switchModule(btn.dataset.module);
  }
});

// ─────────────────────────────────────────────────────────────
//  DYNAMIC FORM BUILDER (GENERADOR DE FORMULARIOS)
// ─────────────────────────────────────────────────────────────
function buildFormForModule(moduleKey) {
  const container = document.getElementById('crm-form-fields');
  if (!container) return;

  const moduleDef = window.Glosaurio.CMS_MODULES[moduleKey];
  CRM.stepCount = 0;

  container.innerHTML = moduleDef.schema.map(field => {
    if (field.id === 'isDraft') return '';

    let inputHtml = '';
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'text':
      case 'url':
        inputHtml = `<input id="${fieldId}" type="text" class="form-input" placeholder="${field.placeholder || ''}">`;
        break;

      case 'number':
        inputHtml = `<input id="${fieldId}" type="number" class="form-input" placeholder="${field.placeholder || ''}">`;
        break;

      case 'textarea':
        inputHtml = `<textarea id="${fieldId}" class="form-textarea" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}"></textarea>`;
        break;

      case 'markdown':
        inputHtml = `
          <div class="code-editor">
            <div class="flex gap-2 mb-2 font-caption text-[var(--outline)] justify-between items-center">
              <span>Soporte Markdown</span>
              <span>editor.md</span>
            </div>
            <textarea id="${fieldId}" class="code-textarea" rows="12" placeholder="${field.placeholder || ''}"></textarea>
          </div>`;
        break;

      case 'code':
        inputHtml = `
          <div class="code-editor">
            <div class="flex gap-2 mb-2 font-caption text-[var(--outline)] justify-between items-center">
              <div class="flex gap-1">
                <span class="w-3 h-3 rounded-full" style="background: var(--error);"></span>
                <span class="w-3 h-3 rounded-full" style="background: var(--secondary);"></span>
                <span class="w-3 h-3 rounded-full" style="background: var(--primary);"></span>
              </div>
              <span>prompt.txt</span>
            </div>
            <textarea id="${fieldId}" class="code-textarea" rows="8" placeholder="${field.placeholder || ''}"></textarea>
          </div>`;
        break;

      case 'select':
        const optionsHtml = (field.options || []).map(opt =>
          `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        inputHtml = `
          <div class="relative">
            <select id="${fieldId}" class="form-select pr-10">${optionsHtml}</select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--outline); font-size: 18px;">expand_more</span>
          </div>`;
        break;

      case 'dynamic-select':
        // Se renderiza vacío, populateCategoryOptions se encarga de rellenarlo con la BD
        inputHtml = `
          <div class="relative">
            <select id="${fieldId}" class="form-select pr-10">
              <option value="">Cargando categorías...</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--outline); font-size: 18px;">expand_more</span>
          </div>`;
        break;

      case 'range':
        inputHtml = `
          <div class="relative">
            <input id="${fieldId}" type="range" min="${field.min || 1}" max="${field.max || 10}" value="${field.default || 5}" class="w-full mt-3" style="accent-color: var(--secondary);">
            <span id="${fieldId}-display" class="absolute right-0 -top-1 font-label-md text-xs" style="color: var(--secondary);">${field.default || 5}/${field.max || 10}</span>
          </div>`;
        break;

      case 'tags':
        inputHtml = `<input id="${fieldId}" type="text" class="form-input" placeholder="${field.placeholder || 'Ej: tag1, tag2'}">`;
        break;

      case 'lines':
        inputHtml = `<textarea id="${fieldId}" class="form-textarea" rows="${field.rows || 4}" placeholder="${field.placeholder || ''}"></textarea>`;
        break;

      case 'boolean':
        inputHtml = `
          <label class="flex items-center gap-3 cursor-pointer mt-2">
            <input id="${fieldId}" type="checkbox" class="rounded text-primary focus:ring-primary" style="accent-color: var(--primary);">
            <span class="font-body-md" style="color: var(--on-surface-variant);">${field.label}</span>
          </label>`;
        break;

      case 'steps':
        inputHtml = `
          <div id="steps-container" class="space-y-3 mb-4"></div>
          <button id="btn-add-step" type="button" class="btn-secondary w-full justify-center" style="padding: 10px;">
            <span class="material-symbols-outlined text-sm">add</span> Agregar Paso
          </button>`;
        break;
    }

    const hideLabel = field.type === 'boolean';
    return `
      <section class="glass-panel p-6">
        ${hideLabel ? '' : `<h2 class="font-label-md block mb-3" style="color: var(--on-surface-variant);">${field.label} ${field.required ? '*' : ''}</h2>`}
        ${inputHtml}
      </section>
    `;
  }).join('');

  // Rellenar dinámicamente opciones de categorías de la base de datos
  moduleDef.schema.forEach(field => {
    if (field.type === 'dynamic-select') {
      populateCategoryOptions(`field-${field.id}`, moduleKey);
    }
    if (field.type === 'range') {
      const fieldId = `field-${field.id}`;
      document.getElementById(fieldId)?.addEventListener('input', e => {
        const display = document.getElementById(`${fieldId}-display`);
        if (display) display.textContent = `${e.target.value}/${field.max || 10}`;
      });
    }
  });

  // Re-enlazar eventos del constructor de pasos si existe
  if (moduleDef.schema.some(f => f.type === 'steps')) {
    document.getElementById('btn-add-step')?.addEventListener('click', () => addStepInput());
    const container = document.getElementById('steps-container');
    container?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-remove-step');
      if (btn) btn.closest('[data-step-id]')?.remove();
    });
    addStepInput();
  }
}

async function populateCategoryOptions(fieldId, moduleKey, selectedVal = '') {
  const select = document.getElementById(fieldId);
  if (!select) return;

  // Filtrar categorías del módulo actual
  const moduleCats = CRM.categories.filter(c => c.module === moduleKey);

  if (moduleCats.length === 0) {
    select.innerHTML = '<option value="">Sin categorías. Configúralas en la barra lateral.</option>';
    return;
  }

  select.innerHTML = moduleCats.map(c =>
    `<option value="${c.name}">${c.icon} ${c.name}</option>`
  ).join('');

  if (selectedVal) {
    select.value = selectedVal;
  }
}

// Steps logic
function addStepInput(label = '', detail = '') {
  const container = document.getElementById('steps-container');
  if (!container) return;
  CRM.stepCount++;
  const id = `step-${CRM.stepCount}`;
  const el = document.createElement('div');
  el.dataset.stepId = id;
  el.className = 'p-4 rounded-xl space-y-2';
  el.style.cssText = 'background: var(--surface-container-low); border: 1px solid var(--outline-variant);';
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="font-caption uppercase tracking-wider" style="color: var(--outline);">Paso ${container.children.length + 1}</span>
      <button type="button" class="btn-remove-step" data-id="${id}" style="background: none; border: none; cursor: pointer; color: var(--error);">
        <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
      </button>
    </div>
    <input type="text" class="form-input" placeholder="Título del paso" value="${label}" style="padding: 10px 14px;">
    <textarea class="form-textarea" placeholder="Descripción del paso..." rows="2" style="padding: 10px 14px;">${detail}</textarea>
  `;
  container.appendChild(el);
}

function getStepsFromForm() {
  const container = document.getElementById('steps-container');
  if (!container) return [];
  return Array.from(container.children).map(el => {
    const [title, textarea] = el.querySelectorAll('input, textarea');
    return { label: title?.value || '', detail: textarea?.value || '' };
  }).filter(s => s.label.trim());
}

// ─────────────────────────────────────────────────────────────
//  LOAD & FILTER ITEMS
// ─────────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    CRM.categories = await window.DataSource.getItems('cms_categories');
  } catch (err) {
    console.error('Error cargando categorías:', err);
    CRM.categories = [];
  }
}

async function loadItems() {
  setTableLoading(true);
  try {
    const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
    CRM.items = await window.DataSource.getItems(moduleDef.collection);
    renderTable();
  } catch (err) {
    showToast('❌ Error cargando contenidos: ' + err.message);
    console.error(err);
    CRM.items = [];
    renderTable();
  } finally {
    setTableLoading(false);
    document.getElementById('table-loading')?.classList.add('hidden');
  }
}

function setTableLoading(on) {
  document.getElementById('table-loading')?.classList.toggle('hidden', !on);
}

function filteredItems() {
  const q = CRM.searchQuery.toLowerCase();
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const titleField = moduleDef.titleField;

  return CRM.items.filter(item => {
    const matchTab =
      CRM.activeTab === 'all'       ? true :
      CRM.activeTab === 'published' ? !item.isDraft :
      CRM.activeTab === 'draft'     ? item.isDraft : true;

    const mainTitle = String(item[titleField] || '').toLowerCase();
    const matchSearch = !q || mainTitle.includes(q) ||
      String(item.category || '').toLowerCase().includes(q) ||
      String(item.description || '').toLowerCase().includes(q);

    return matchTab && matchSearch;
  });
}

// ─────────────────────────────────────────────────────────────
//  GENERIC TABLE RENDER (TABLA DINÁMICA)
// ─────────────────────────────────────────────────────────────
function renderTable() {
  const thead = document.getElementById('crm-thead');
  const tbody = document.getElementById('crm-tbody');
  const empty = document.getElementById('table-empty');
  const info  = document.getElementById('table-info');

  if (!tbody || !thead) return;

  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const items = filteredItems();

  // Filtrar los campos del schema a mostrar como columnas (máx 2 simples)
  const columns = moduleDef.schema.filter(f =>
    ['text', 'number', 'select', 'dynamic-select', 'range'].includes(f.type) && f.id !== moduleDef.titleField
  ).slice(0, 2);

  // Pintar la cabecera
  thead.innerHTML = `
    <tr>
      <th>${moduleDef.schema.find(f => f.id === moduleDef.titleField)?.label || 'Título'}</th>
      ${columns.map(col => `<th>${col.label}</th>`).join('')}
      <th>Estado</th>
      <th style="text-align: right;">Acciones</th>
    </tr>
  `;

  // Contadores de tabs
  const allPub   = CRM.items.filter(t => !t.isDraft).length;
  const allDraft = CRM.items.filter(t => t.isDraft).length;
  document.getElementById('count-all').textContent   = CRM.items.length;
  document.getElementById('count-pub').textContent   = allPub;
  document.getElementById('count-draft').textContent = allDraft;

  if (items.length === 0) {
    tbody.innerHTML = '';
    empty?.classList.remove('hidden');
    if (info) info.textContent = '';
    return;
  }
  empty?.classList.add('hidden');
  if (info) info.textContent = `Mostrando ${items.length} de ${CRM.items.length} registros`;

  // Inyectar filas
  tbody.innerHTML = items.map(item => {
    const titleVal = item[moduleDef.titleField] || '(sin título)';
    const isEditing = item.id === CRM.editingId;

    const rowColsHtml = columns.map(col => {
      const val = item[col.id];
      if (col.id === 'category') {
        // Buscar el emoji de la categoría en nuestra lista cargada
        const catObj = CRM.categories.find(c => c.name === val && c.module === CRM.activeModule);
        const icon = catObj ? catObj.icon : '📌';
        return `<td><span class="chip chip-neutral" style="font-size: 0.7rem;">${icon} ${val || ''}</span></td>`;
      }
      if (col.type === 'range') {
        return `<td><span class="font-label-md" style="color: var(--secondary);">${val || 5}/10</span></td>`;
      }
      return `<td><span class="font-body-md" style="color: var(--on-surface-variant);">${val || '--'}</span></td>`;
    }).join('');

    const statusChip = item.isDraft
      ? '<span class="chip chip-neutral" style="font-size: 0.7rem;">Borrador</span>'
      : '<span class="chip chip-tertiary" style="font-size: 0.7rem;">Publicado</span>';

    return `
      <tr style="${isEditing ? 'background: color-mix(in srgb, var(--secondary) 8%, transparent);' : ''}">
        <td>
          <div class="font-body-md font-semibold" style="color: var(--on-surface); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${titleVal}">${titleVal}</div>
          ${isEditing ? '<span class="font-caption" style="color: var(--secondary);">✏️ editando</span>' : ''}
        </td>
        ${rowColsHtml}
        <td>${statusChip}</td>
        <td>
          <div class="flex gap-2 justify-end">
            <button class="btn-icon btn-edit" data-id="${item.id}" title="Editar" style="width: 34px; height: 34px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            </button>
            <button class="btn-icon btn-toggle-draft" data-id="${item.id}" title="${item.isDraft ? 'Publicar' : 'Volver a borrador'}" style="width: 34px; height: 34px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">${item.isDraft ? 'publish' : 'unpublished'}</span>
            </button>
            <button class="btn-icon btn-delete" data-id="${item.id}" title="Eliminar"
                    style="width: 34px; height: 34px; color: var(--error); border-color: color-mix(in srgb, var(--error) 30%, transparent);">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
//  GENERIC FORM READ / WRITE (LECTURA Y ESCRITURA DINÁMICA)
// ─────────────────────────────────────────────────────────────
function buildItemFromForm(isDraft = false) {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const item = { isDraft };

  if (CRM.editingId) {
    item.id = CRM.editingId;
  }

  for (const field of moduleDef.schema) {
    if (field.id === 'isDraft') continue;

    const elId = `field-${field.id}`;
    const el = document.getElementById(elId);

    if (field.required && (!el || !el.value.trim()) && field.type !== 'steps') {
      showToast(`⚠️ El campo "${field.label}" es obligatorio`);
      return null;
    }

    if (!el && field.type !== 'steps') continue;

    switch (field.type) {
      case 'text':
      case 'url':
      case 'textarea':
      case 'markdown':
      case 'code':
      case 'select':
      case 'dynamic-select':
        item[field.id] = el.value.trim();
        break;

      case 'number':
        item[field.id] = el.value ? parseFloat(el.value) : 0;
        break;

      case 'range':
        item[field.id] = parseInt(el.value);
        break;

      case 'boolean':
        item[field.id] = el.checked;
        break;

      case 'tags':
        item[field.id] = el.value.split(',').map(s => s.trim()).filter(Boolean);
        break;

      case 'lines':
        item[field.id] = el.value.split('\n').map(s => s.trim()).filter(Boolean);
        break;

      case 'steps':
        item[field.id] = getStepsFromForm();
        break;
    }
  }

  return item;
}

function loadItemIntoForm(item) {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];

  for (const field of moduleDef.schema) {
    if (field.id === 'isDraft') continue;

    const elId = `field-${field.id}`;
    const el = document.getElementById(elId);
    const val = item[field.id];

    if (!el && field.type !== 'steps') continue;

    switch (field.type) {
      case 'text':
      case 'url':
      case 'textarea':
      case 'markdown':
      case 'code':
      case 'select':
        el.value = val || '';
        break;

      case 'dynamic-select':
        populateCategoryOptions(elId, CRM.activeModule, val);
        break;

      case 'number':
        el.value = val !== undefined ? val : '';
        break;

      case 'range':
        el.value = val !== undefined ? val : (field.default || 5);
        const display = document.getElementById(`${elId}-display`);
        if (display) display.textContent = `${el.value}/${field.max || 10}`;
        break;

      case 'boolean':
        el.checked = !!val;
        break;

      case 'tags':
        el.value = (val || []).join(', ');
        break;

      case 'lines':
        el.value = (val || []).join('\n');
        break;

      case 'steps':
        const container = document.getElementById('steps-container');
        if (container) container.innerHTML = '';
        CRM.stepCount = 0;
        (val || []).forEach(s => addStepInput(s.label, s.detail));
        if (!val || val.length === 0) addStepInput();
        break;
    }
  }

  CRM.editingId = item.id;
  document.getElementById('edit-banner')?.classList.remove('hidden');
  const nameEl = document.getElementById('edit-banner-name');
  if (nameEl) {
    nameEl.textContent = `Editando: "${item[moduleDef.titleField] || ''}"`;
  }

  showCRMForm(false);
}

function resetForm() {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];

  for (const field of moduleDef.schema) {
    if (field.id === 'isDraft') continue;

    const elId = `field-${field.id}`;
    const el = document.getElementById(elId);

    if (!el && field.type !== 'steps') continue;

    switch (field.type) {
      case 'text':
      case 'url':
      case 'textarea':
      case 'markdown':
      case 'code':
        el.value = '';
        break;

      case 'number':
        el.value = '';
        break;

      case 'select':
        el.selectedIndex = 0;
        break;

      case 'dynamic-select':
        populateCategoryOptions(elId, CRM.activeModule);
        break;

      case 'range':
        el.value = field.default || 5;
        const display = document.getElementById(`${elId}-display`);
        if (display) display.textContent = `${el.value}/${field.max || 10}`;
        break;

      case 'boolean':
        el.checked = false;
        break;

      case 'tags':
        el.value = '';
        break;

      case 'lines':
        el.value = '';
        break;

      case 'steps':
        const container = document.getElementById('steps-container');
        if (container) container.innerHTML = '';
        CRM.stepCount = 0;
        addStepInput();
        break;
    }
  }

  CRM.editingId = null;
  document.getElementById('edit-banner')?.classList.add('hidden');
  const lbl = document.getElementById('publish-label');
  if (lbl) lbl.textContent = 'Publicar';
  const chip = document.getElementById('editor-mode-chip');
  if (chip) chip.textContent = `Nuevo ${moduleDef.label.split('/')[0].trim()}`;
}

// ─────────────────────────────────────────────────────────────
//  GENERIC CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────
async function publishItem() {
  const item = buildItemFromForm(false);
  if (!item) return;

  const btn = document.getElementById('btn-publish');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined text-sm spin">sync</span> Guardando...';

  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];

  try {
    if (CRM.editingId) {
      await window.DataSource.updateItem(moduleDef.collection, CRM.editingId, item);
      showToast('✅ Registro actualizado correctamente');
    } else {
      await window.DataSource.createItem(moduleDef.collection, item);
      showToast('🚀 Registro creado con éxito');
    }
    resetForm();
    await loadItems();
    showCRMList();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">publish</span> <span id="publish-label">Publicar</span>';
  }
}

async function saveDraft() {
  const item = buildItemFromForm(true);
  if (!item) return;

  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];

  try {
    if (CRM.editingId) {
      await window.DataSource.updateItem(moduleDef.collection, CRM.editingId, item);
    } else {
      await window.DataSource.createItem(moduleDef.collection, item);
    }
    showToast('📝 Borrador guardado');
    resetForm();
    await loadItems();
    showCRMList();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
    console.error(err);
  }
}

async function deleteItem(id) {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const item = CRM.items.find(t => t.id === id);
  const titleVal = item ? item[moduleDef.titleField] : 'este elemento';

  if (!confirm(`¿Eliminar "${titleVal}"? Esta acción es irreversible.`)) return;

  try {
    await window.DataSource.deleteItem(moduleDef.collection, id);
    showToast('🗑️ Registro eliminado');
    if (CRM.editingId === id) resetForm();
    await loadItems();
  } catch (err) {
    showToast('❌ Error al eliminar: ' + err.message);
  }
}

async function toggleDraft(id) {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  const item = CRM.items.find(t => t.id === id);
  if (!item) return;

  try {
    await window.DataSource.updateItem(moduleDef.collection, id, { ...item, isDraft: !item.isDraft });
    showToast(item.isDraft ? '🚀 Registro publicado' : '📝 Guardado en borradores');
    await loadItems();
  } catch (err) {
    showToast('❌ Error: ' + err.message);
  }
}

function editItem(id) {
  const item = CRM.items.find(t => t.id === id);
  if (item) loadItemIntoForm(item);
}

// ─────────────────────────────────────────────────────────────
//  DYNAMIC CATEGORIES MANAGEMENT (CREAR / ELIMINAR CATEGORÍAS)
// ─────────────────────────────────────────────────────────────
function populateCategoryFormModules() {
  const select = document.getElementById('cat-f-module');
  if (!select) return;

  select.innerHTML = CRM.activeModulesList.map(modKey => {
    const m = window.Glosaurio.CMS_MODULES[modKey];
    return `<option value="${modKey}">${m.label.split('/')[0].trim()}</option>`;
  }).join('');
}

async function saveCategory() {
  const moduleVal = document.getElementById('cat-f-module').value;
  const nameVal = document.getElementById('cat-f-name').value.trim();
  const iconVal = document.getElementById('cat-f-icon').value.trim() || '📌';

  if (!nameVal) {
    showToast('⚠️ El nombre de la categoría es obligatorio.');
    return;
  }

  const btn = document.getElementById('btn-save-category');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await window.DataSource.createItem('cms_categories', {
      name: nameVal,
      icon: iconVal,
      module: moduleVal
    });
    showToast('✅ Categoría creada');
    document.getElementById('cat-f-name').value = '';
    document.getElementById('cat-f-icon').value = '📌';
    await loadCategories();
    renderCategoriesTable();
  } catch (err) {
    showToast('❌ Error al guardar categoría: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Guardar Categoría';
  }
}

async function deleteCategory(id) {
  const cat = CRM.categories.find(c => c.id === id);
  if (!cat) return;
  if (!confirm(`¿Eliminar la categoría "${cat.name}"? Los registros asociados a esta categoría podrían quedar huérfanos.`)) return;

  try {
    await window.DataSource.deleteItem('cms_categories', id);
    showToast('🗑️ Categoría eliminada');
    await loadCategories();
    renderCategoriesTable();
  } catch (err) {
    showToast('❌ Error al eliminar: ' + err.message);
  }
}

function renderCategoriesTable() {
  const tbody = document.getElementById('crm-categories-tbody');
  const empty = document.getElementById('categories-empty');
  if (!tbody) return;

  if (CRM.categories.length === 0) {
    tbody.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  tbody.innerHTML = CRM.categories.map(c => {
    const modDef = window.Glosaurio.CMS_MODULES[c.module];
    const moduleLabel = modDef ? modDef.label.split('/')[0].trim() : c.module;

    return `
      <tr>
        <td><span class="text-lg">${c.icon || '📌'}</span></td>
        <td><span class="font-body-md font-semibold" style="color: var(--on-surface);">${c.name}</span></td>
        <td><span class="chip chip-neutral" style="font-size: 0.70rem;">${moduleLabel}</span></td>
        <td>
          <div class="flex justify-end">
            <button class="btn-icon btn-delete-cat" data-id="${c.id}" title="Eliminar"
                    style="width: 32px; height: 32px; color: var(--error); border-color: color-mix(in srgb, var(--error) 30%, transparent);">
              <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
//  EVENT BINDINGS
// ─────────────────────────────────────────────────────────────
// Guardar categoría
document.getElementById('btn-save-category')?.addEventListener('click', saveCategory);

// Delegar eliminación de categorías
document.getElementById('crm-categories-tbody')?.addEventListener('click', async e => {
  const btn = e.target.closest('.btn-delete-cat');
  if (btn) {
    await deleteCategory(btn.dataset.id);
  }
});

// Publish & Draft
document.getElementById('btn-publish')?.addEventListener('click', publishItem);
document.getElementById('btn-draft')?.addEventListener('click', saveDraft);
document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
  resetForm();
  showCRMList();
});

// New term button
document.getElementById('btn-new-term')?.addEventListener('click', () => {
  resetForm();
  showCRMForm(true);
});

// Empty state new term button
document.getElementById('btn-empty-new')?.addEventListener('click', () => {
  resetForm();
  showCRMForm(true);
});

// Back to list
document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
  resetForm();
  showCRMList();
});

// Table actions (delegated)
document.getElementById('crm-tbody')?.addEventListener('click', async e => {
  const edit   = e.target.closest('.btn-edit');
  const del    = e.target.closest('.btn-delete');
  const toggle = e.target.closest('.btn-toggle-draft');
  if (edit)   editItem(edit.dataset.id);
  if (del)    await deleteItem(del.dataset.id);
  if (toggle) await toggleDraft(toggle.dataset.id);
});

// Tabs (Filtros draft/published)
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    CRM.activeTab = btn.dataset.tab;
    renderTable();
  });
});

// Search (debounced)
let searchTimer;
document.getElementById('crm-search')?.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    CRM.searchQuery = e.target.value;
    renderTable();
  }, 250);
});

// ─────────────────────────────────────────────────────────────
//  PROVIDER BADGE DISPLAYER
// ─────────────────────────────────────────────────────────────
function updateProviderBadges() {
  const isConfigured = window.DataSourceConfig?.isConfigured();
  const provider = window.DataSourceConfig?.getProvider() || 'localStorage';
  
  let txt = '';
  if (!isConfigured) {
    txt = '⚠️ Sin Configurar';
  } else {
    const labels = { supabase: '🟢 Supabase', firebase: '🔥 Firebase', localStorage: '💾 Local' };
    txt = labels[provider] || provider;
  }

  const badgeHeader = document.getElementById('provider-badge');
  if (badgeHeader) {
    badgeHeader.textContent = txt;
    badgeHeader.style.cursor = 'pointer';
    badgeHeader.title = isConfigured ? 'Base de datos configurada. Haz clic para cambiarla.' : '¡Base de datos sin configurar! Haz clic para configurarla ahora.';
    
    if (!isConfigured) {
      badgeHeader.className = 'chip chip-neutral animate-pulse';
      badgeHeader.style.border = '1px solid var(--error, #ba1a1a)';
      badgeHeader.style.color = 'var(--error, #ba1a1a)';
    } else {
      badgeHeader.className = 'chip chip-tertiary';
      badgeHeader.style.border = '';
      badgeHeader.style.color = '';
    }
    
    badgeHeader.onclick = () => {
      window.location.href = 'setup.html';
    };
  }

  const badgeSidebar = document.getElementById('provider-badge-sidebar');
  if (badgeSidebar) {
    badgeSidebar.textContent = txt;
    if (!isConfigured) {
      badgeSidebar.style.color = 'var(--error, #ba1a1a)';
      badgeSidebar.style.fontWeight = 'bold';
    } else {
      badgeSidebar.style.color = '';
      badgeSidebar.style.fontWeight = '';
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  TOAST DISPLAYER
// ─────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ─────────────────────────────────────────────────────────────
//  TEMPLATE DOWNLOAD & JSON IMPORT
// ─────────────────────────────────────────────────────────────
document.getElementById('btn-download-template')?.addEventListener('click', () => {
  const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
  if (!moduleDef) return;

  const template = {};
  moduleDef.schema.forEach(field => {
    if (field.id === 'isDraft') {
      template[field.id] = field.default !== undefined ? field.default : true;
    } else if (field.id === 'colors') {
      template[field.id] = [
        {
          hex: "[Código de color en formato HEX, RGB o HSL, ej: '#2563EB']",
          role: "[Rol o nombre del color, ej: 'Primario', 'Fondo']",
          description: "[Descripción detallada del uso de este color en el diseño]"
        }
      ];
    } else if (field.id === 'typographies') {
      template[field.id] = [
        {
          fontFamily: "[Familia tipográfica de Google Fonts, ej: 'Plus Jakarta Sans']",
          fontSize: "[Tamaño base de la fuente, ej: '16px' o '1rem']",
          weights: [
            "[Pesos de fuente soportados y disponibles, ej: '400', '700']"
          ],
          fontSampleText: "[Texto corto de muestra para previsualizar la tipografía]"
        }
      ];
    } else if (field.id === 'logos') {
      template[field.id] = [
        {
          name: "[Nombre identificativo del logotipo, ej: 'Logo Principal' o 'Isotipo']",
          svgContent: "[Código XML crudo del SVG, ej: <svg ...>...</svg>]"
        }
      ];
    } else if (field.type === 'steps') {
      template[field.id] = [
        { 
          label: `[Nombre o título corto del paso. Campo: ${field.label}]`, 
          detail: `[Explicación detallada de las acciones específicas para este paso. Campo: ${field.label}]` 
        }
      ];
    } else if (field.type === 'lines') {
      template[field.id] = [
        `[Descripción del elemento o línea 1. Campo: ${field.label}]`, 
        `[Descripción del elemento o línea 2. Campo: ${field.label}]`
      ];
    } else if (field.type === 'tags') {
      template[field.id] = [
        `[Etiqueta1_de_${field.id}]`, 
        `[Etiqueta2_de_${field.id}]`
      ];
    } else if (field.type === 'number' || field.type === 'range') {
      template[field.id] = field.default !== undefined ? field.default : 0;
    } else if (field.type === 'boolean') {
      template[field.id] = field.default !== undefined ? field.default : false;
    } else {
      template[field.id] = `[Descripción de lo esperado: ${field.label}. ${field.placeholder || ''}]`;
    }
  });

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([template], null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `plantilla_${CRM.activeModule}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

const fileInput = document.getElementById('import-file-input');
document.getElementById('btn-import-json')?.addEventListener('click', () => {
  fileInput?.click();
});

function showImportConfirmationModal(items, moduleDef) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300';
    modal.id = 'import-confirm-modal';
    
    const activeModuleCategories = (CRM.categories || [])
      .filter(c => c.module === CRM.activeModule)
      .map(c => c.name);

    const availableCategories = [...new Set(activeModuleCategories)];
    if (availableCategories.length === 0) {
      availableCategories.push('Diseño & Marca', 'Vibe Coding', 'Gestión', 'Automatización', 'Tech');
    }

    const titleField = moduleDef.titleField || 'title';
    const itemsHtml = items.map((item, index) => {
      const title = item[titleField] || item.title || item.name || 'Sin título';
      const category = item.category || availableCategories[0] || 'Diseño & Marca';
      
      const optionsHtml = availableCategories.map(cat => 
        `<option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>`
      ).join('');

      return `
        <div class="flex items-center justify-between p-3 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-high)] gap-4">
          <div class="flex items-center gap-3">
            <input type="checkbox" class="item-select-checkbox w-4 h-4 rounded text-[var(--primary)] border-[var(--outline)] focus:ring-[var(--primary)]" data-index="${index}" checked>
            <span class="font-semibold text-sm truncate max-w-[180px] text-[var(--on-surface)]" title="${title}">${title}</span>
          </div>
          <select class="item-category-select text-xs p-1.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-highest)] text-[var(--on-surface)] focus:ring-[var(--primary)]" data-index="${index}">
            ${optionsHtml}
          </select>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-[var(--outline-variant)] bg-[var(--surface)] text-[var(--on-surface)] animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div class="flex items-center justify-between mb-4 border-b border-[var(--outline-variant)] pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-500">warning</span>
            <h3 class="font-headline-sm text-lg font-bold text-[var(--on-surface)]">Confirmar Importación</h3>
          </div>
          <button id="modal-close" class="btn-icon text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        <p class="font-body-md text-sm text-[var(--on-surface-variant)] mb-4">
          Se han detectado <strong>${items.length}</strong> registros listos para importar. Selecciona los que deseas importar y ajusta sus categorías si lo prefieres:
        </p>
        
        <div class="flex-1 overflow-y-auto space-y-2 mb-6 max-h-[40vh] pr-1">
          ${itemsHtml}
        </div>
        
        <div class="flex items-center justify-end gap-3 border-t border-[var(--outline-variant)] pt-4">
          <button id="modal-btn-cancel" class="btn-secondary px-4 py-2 text-sm font-semibold rounded-xl border border-[var(--outline-variant)] hover:bg-[var(--surface-container-high)]">
            Cancelar
          </button>
          <button id="modal-btn-confirm" class="btn-primary px-4 py-2 text-sm font-semibold rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
            Importar ahora
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = (result) => {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        resolve(result);
      }, 200);
    };

    modal.querySelector('#modal-close').onclick = () => closeModal(null);
    modal.querySelector('#modal-btn-cancel').onclick = () => closeModal(null);
    
    modal.querySelector('#modal-btn-confirm').onclick = () => {
      const selectedItems = [];
      const checkboxes = modal.querySelectorAll('.item-select-checkbox');
      const selects = modal.querySelectorAll('.item-category-select');

      checkboxes.forEach((cb) => {
        if (cb.checked) {
          const index = parseInt(cb.getAttribute('data-index'));
          const item = { ...items[index] };
          const select = Array.from(selects).find(s => parseInt(s.getAttribute('data-index')) === index);
          if (select) {
            item.category = select.value;
          }
          selectedItems.push(item);
        }
      });

      closeModal(selectedItems);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(null);
    };
  });
}

fileInput?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async event => {
    try {
      let data = JSON.parse(event.target.result);
      // Si el JSON está envuelto (ej: { contentType, data: [...] }) extraemos el array
      if (data && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data;
      }
      const itemsToImport = Array.isArray(data) ? data : [data];
      
      const moduleDef = window.Glosaurio.CMS_MODULES[CRM.activeModule];
      if (!moduleDef) throw new Error('Módulo activo no válido');

      // Validar previamente para no mostrar el modal con datos erróneos
      const validatedItems = [];
      for (const item of itemsToImport) {
        const cleanItem = {};
        moduleDef.schema.forEach(field => {
          const snakeId = field.id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          const value = item[field.id] !== undefined ? item[field.id] : item[snakeId];

          if (value !== undefined) {
            cleanItem[field.id] = value;
          } else if (field.required) {
            throw new Error(`El campo requerido "${field.label}" (se esperaba la clave "${field.id}") está ausente. Claves encontradas en tu archivo: [${Object.keys(item).join(', ')}]`);
          }
        });
        validatedItems.push(cleanItem);
      }

      // Pedir confirmación con el modal
      const confirmedItems = await showImportConfirmationModal(validatedItems, moduleDef);
      if (!confirmedItems || confirmedItems.length === 0) {
        showToast('⏹️ Importación cancelada o sin elementos seleccionados');
        return;
      }

      showToast(`⏳ Importando ${confirmedItems.length} registros...`);

      let importedCount = 0;
      for (const cleanItem of confirmedItems) {
        await window.DataSource.createItem(moduleDef.collection, cleanItem);
        importedCount++;
      }

      showToast(`✅ ¡Importados ${importedCount} registros con éxito!`);
      await loadItems();
    } catch (err) {
      console.error(err);
      showToast(`❌ Error al importar: ${err.message}`);
    } finally {
      fileInput.value = '';
    }
  };
  reader.readAsText(file);
});

// ─────────────────────────────────────────────────────────────
//  INIT CMS WORKSPACE
// ─────────────────────────────────────────────────────────────
async function init() {
  // Theme initialization is handled automatically in data-source-config.js
  updateProviderBadges();

  const isConfigured = window.DataSourceConfig?.isConfigured();
  if (!isConfigured) {
    renderSidebarModules();
    showUnconfiguredScreen();
    
    // Ocultar botón Probar
    const btnTestDb = document.getElementById('btn-test-db');
    if (btnTestDb) btnTestDb.style.display = 'none';
    return;
  }

  // Probar conexión a Base de Datos
  const btnTestDb = document.getElementById('btn-test-db');
  if (btnTestDb) {
    btnTestDb.addEventListener('click', async () => {
      const statusEl = document.getElementById('db-test-status');
      const iconEl = document.getElementById('db-test-icon');
      const textEl = document.getElementById('db-test-text');
      
      if (!statusEl || !iconEl || !textEl) return;

      // Reset & Set loading state
      statusEl.classList.remove('hidden', 'bg-green-500/10', 'text-green-400', 'border-green-500/20', 'bg-red-500/10', 'text-red-400', 'border-red-500/20');
      statusEl.classList.add('bg-[var(--surface-container-high)]', 'text-[var(--on-surface-variant)]');
      statusEl.innerHTML = '<span class="material-symbols-outlined text-[14px] spin mr-1" style="vertical-align: middle;">sync</span> Conectando...';
      statusEl.classList.remove('hidden');
      
      iconEl.textContent = 'sync';
      iconEl.classList.add('spin');
      btnTestDb.disabled = true;
      btnTestDb.style.opacity = '0.6';
      textEl.textContent = 'Probando';

      try {
        const collection = CRM.activeModule && CRM.activeModule !== 'categories' 
          ? (window.Glosaurio?.CMS_MODULES[CRM.activeModule]?.collection || 'terms')
          : 'terms';
          
        const result = await window.DataSource.testConnection(collection);
        
        statusEl.classList.remove('bg-[var(--surface-container-high)]', 'text-[var(--on-surface-variant)]');
        
        if (result.ok) {
          statusEl.classList.add('bg-green-500/10', 'text-green-400', 'border', 'border-green-500/20');
          statusEl.innerHTML = `✅ ${result.message}`;
          showToast('🟢 Conexión exitosa verificada.');
        } else {
          statusEl.classList.add('bg-red-500/10', 'text-red-400', 'border', 'border-red-500/20');
          statusEl.innerHTML = `❌ ${result.message}`;
          showToast('🔴 Error en la conexión.');
        }
      } catch (err) {
        statusEl.classList.remove('bg-[var(--surface-container-high)]', 'text-[var(--on-surface-variant)]');
        statusEl.classList.add('bg-red-500/10', 'text-red-400', 'border', 'border-red-500/20');
        statusEl.innerHTML = `❌ Error: ${err.message}`;
        showToast('🔴 Error al conectar.');
      } finally {
        iconEl.textContent = 'network_ping';
        iconEl.classList.remove('spin');
        btnTestDb.disabled = false;
        btnTestDb.style.opacity = '1';
        textEl.textContent = 'Probar';
      }
    });
  }

  const cfg = window.DataSourceConfig.getConfig() || {};
  const defaultModules = Object.keys(window.Glosaurio.CMS_MODULES || {});
  const activeModules = cfg.activeModules || defaultModules;

  // Switch al primer módulo activo disponible
  if (activeModules.length > 0) {
    await switchModule(activeModules[0]);
  }
}

document.addEventListener('DOMContentLoaded', init);

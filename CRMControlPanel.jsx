import React, { useState, useEffect, useRef } from 'react';

// Reusable REST Adapters inside the component structure
class SupabaseRESTService {
  constructor(config, sessionToken = null) {
    this.url = config.url.replace(/\/$/, '');
    this.anonKey = config.anonKey;
    this.sessionToken = sessionToken;
  }

  _headers(extra = {}) {
    const authHeader = this.sessionToken 
      ? `Bearer ${this.sessionToken}` 
      : `Bearer ${this.anonKey}`;
    return {
      'apikey': this.anonKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extra
    };
  }

  async getItems(collection) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?select=*&order=created_at.desc`, {
      headers: this._headers()
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al obtener datos');
    return await res.json();
  }

  async createItem(collection, item) {
    const res = await fetch(`${this.url}/rest/v1/${collection}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(item)
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al crear el registro');
    return await res.json();
  }

  async updateItem(collection, id, item) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(item)
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al actualizar el registro');
    return await res.json();
  }

  async deleteItem(collection, id) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this._headers()
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al eliminar el registro');
    return await res.json();
  }

  // REST Auth actions
  async signIn(email, password) {
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': this.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description || err.message || 'Error de inicio de sesión');
    }
    const data = await res.json();
    return {
      token: data.access_token,
      user: data.user
    };
  }
}

function HoldToConfirmButton({ onConfirm, children, className, style, title, duration = 2000 }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const startHold = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setProgress(100);
      setHolding(false);
      onConfirm();
    }, duration);
  };

  const cancelHold = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className={`${className || ''} relative overflow-hidden`}
      style={{ ...style, position: 'relative' }}
      title={holding ? `Mantén presionado (${Math.round((duration - (progress * duration / 100)) / 1000)}s)...` : title}
      type="button"
    >
      {holding && (
        <div 
          className="absolute left-0 bottom-0 top-0 pointer-events-none transition-all duration-75"
          style={{ 
            width: `${progress}%`, 
            background: 'color-mix(in_srgb, var(--error) 25%, transparent)',
            borderRight: '2px solid var(--error)'
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1 w-full h-full">
        {children}
      </span>
    </button>
  );
}

export default function CRMControlPanel({ config, session: propSession, setSession: propSetSession }) {
  const [localSession, setLocalSession] = useState(null);
  const session = propSession !== undefined ? propSession : localSession;
  const setSession = propSetSession || setLocalSession;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // CMS state
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeModule, setActiveModule] = useState(config.activeModules?.[0] || 'terms');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Diseño & Marca',
    description: '',
    tools: [],
    isDraft: false,
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
    logos: [{ name: '', svgContent: '' }]
  });
  const [selectedId, setSelectedId] = useState(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    identity: true,
    steps: true,
    problems: true,
    metrics: true,
    prompt: true,
    scenarios: true,
    code: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [activePanels, setActivePanels] = useState({
    steps: false,
    problems: false,
    metrics: false,
    prompt: false,
    scenarios: false,
    code: false,
    color: false,
    typography: false,
    logo: false
  });

  // Dynamic step management helpers
  const handleStepChange = (index, field, value) => {
    const nextSteps = [...(formData.steps || [])];
    nextSteps[index] = { ...nextSteps[index], [field]: value };
    setFormData({ ...formData, steps: nextSteps });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), { label: '', detail: '' }]
    });
  };

  const removeStep = (index) => {
    const nextSteps = [...(formData.steps || [])];
    nextSteps.splice(index, 1);
    setFormData({ ...formData, steps: nextSteps });
  };

  const addTool = (tool) => {
    const trimmed = tool.trim();
    if (!trimmed) return;
    const toolsArr = Array.isArray(formData.tools) ? formData.tools : [];
    if (toolsArr.includes(trimmed)) return;
    setFormData({ ...formData, tools: [...toolsArr, trimmed] });
  };

  const removeTool = (index) => {
    const toolsArr = Array.isArray(formData.tools) ? [...formData.tools] : [];
    toolsArr.splice(index, 1);
    setFormData({ ...formData, tools: toolsArr });
  };

  const handleColorChange = (index, field, value) => {
    const nextColors = [...(formData.colors || [])];
    nextColors[index] = { ...nextColors[index], [field]: value };
    setFormData({ ...formData, colors: nextColors });
  };
  const addColor = () => {
    setFormData({ ...formData, colors: [...(formData.colors || []), { hex: '', role: '', description: '' }] });
  };
  const removeColor = (index) => {
    const nextColors = [...(formData.colors || [])];
    nextColors.splice(index, 1);
    setFormData({ ...formData, colors: nextColors });
  };

  const handleTypographyChange = (index, field, value) => {
    const nextTypos = [...(formData.typographies || [])];
    nextTypos[index] = { ...nextTypos[index], [field]: value };
    setFormData({ ...formData, typographies: nextTypos });
  };
  const addTypography = () => {
    setFormData({ ...formData, typographies: [...(formData.typographies || []), { fontFamily: '', weights: [], fontSize: '', sampleText: '' }] });
  };
  const removeTypography = (index) => {
    const nextTypos = [...(formData.typographies || [])];
    nextTypos.splice(index, 1);
    setFormData({ ...formData, typographies: nextTypos });
  };

  const handleLogoChange = (index, field, value) => {
    const nextLogos = [...(formData.logos || [])];
    nextLogos[index] = { ...nextLogos[index], [field]: value };
    setFormData({ ...formData, logos: nextLogos });
  };
  const addLogo = () => {
    setFormData({ ...formData, logos: [...(formData.logos || []), { name: '', svgContent: '' }] });
  };
  const removeLogo = (index) => {
    const nextLogos = [...(formData.logos || [])];
    nextLogos.splice(index, 1);
    setFormData({ ...formData, logos: nextLogos });
  };

  // Initialize service
  const service = config.provider === 'supabase' 
    ? new SupabaseRESTService(config.supabase, session?.token)
    : null;

  // 1. Check local session storage on load
  useEffect(() => {
    if (config.provider === 'supabase') {
      const cached = localStorage.getItem(`crm_session_${config.supabase?.url}`);
      if (cached) {
        try {
          setSession(JSON.parse(cached));
        } catch (e) {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
      }
    } else {
      // LocalStorage provider doesn't require session auth
      setSession({ local: true });
    }
  }, [config.provider, config.supabase?.url]);

  // 2. Fetch data once session is active
  useEffect(() => {
    if (session) {
      fetchCMSData();
    }
  }, [session, activeModule]);

  const fetchCMSData = async () => {
    if (config.provider === 'localStorage') {
      const cachedData = localStorage.getItem(`glosaurio_${activeModule}`);
      setItems(cachedData ? JSON.parse(cachedData) : []);
      return;
    }

    setLoadingData(true);
    try {
      const rawItems = await service.getItems(activeModule);
      // Map keys snake_case to camelCase
      const mapped = rawItems.map(item => {
        if (activeModule === 'design_tokens') {
          return {
            id: item.id,
            brandName: item.brand_name || '',
            colors: Array.isArray(item.colors) ? item.colors : [],
            typographies: Array.isArray(item.typographies) ? item.typographies : [],
            logos: Array.isArray(item.logos) ? item.logos : [],
            isDraft: item.is_draft || item.isDraft || false
          };
        }
        return {
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          tools: Array.isArray(item.tools) ? item.tools : [],
          isDraft: item.is_draft || item.isDraft || false,
          prompt: item.prompt || '',
          promptVars: Array.isArray(item.prompt_vars) ? item.prompt_vars : (Array.isArray(item.promptVars) ? item.promptVars : []),
          problems: Array.isArray(item.problems) ? item.problems : [],
          benefits: Array.isArray(item.benefits) ? item.benefits : [],
          recommendedScenarios: Array.isArray(item.recommended_scenarios) ? item.recommended_scenarios : (Array.isArray(item.recommendedScenarios) ? item.recommendedScenarios : []),
          criticalExclusions: Array.isArray(item.critical_exclusions) ? item.critical_exclusions : (Array.isArray(item.criticalExclusions) ? item.criticalExclusions : []),
          technicalExample: item.technical_example || item.technicalExample || '',
          steps: Array.isArray(item.steps) ? item.steps : [],
          results: item.results || '',
          metrics: item.metrics || ''
        };
      });
      setItems(mapped);
    } catch (e) {
      console.error('Error fetching CRM data:', e);
      if (e.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Auth Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);
    try {
      const authService = new SupabaseRESTService(config.supabase);
      const resSession = await authService.signIn(email, password);
      localStorage.setItem(`crm_session_${config.supabase.url}`, JSON.stringify(resSession));
      setSession(resSession);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    if (config.provider === 'supabase') {
      localStorage.removeItem(`crm_session_${config.supabase.url}`);
    }
    setSession(null);
  };

  // CRUD actions
  const handleSave = async (e, draftOverride = null) => {
    if (e) e.preventDefault();
    const finalDraftStatus = draftOverride !== null ? draftOverride : formData.isDraft;
    
    let formattedData = {};
    if (activeModule === 'design_tokens') {
      formattedData = {
        brand_name: formData.brandName,
        colors: formData.colors || [],
        typographies: formData.typographies || [],
        logos: formData.logos || [],
        is_draft: finalDraftStatus
      };
    } else {
      formattedData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        is_draft: finalDraftStatus,
        prompt: formData.prompt,
        tools: formData.tools || [],
        problems: typeof formData.problems === 'string' ? formData.problems.split('\n').map(x => x.trim()).filter(Boolean) : formData.problems,
        benefits: typeof formData.benefits === 'string' ? formData.benefits.split('\n').map(x => x.trim()).filter(Boolean) : formData.benefits,
        recommended_scenarios: typeof formData.recommendedScenarios === 'string' ? formData.recommendedScenarios.split('\n').map(x => x.trim()).filter(Boolean) : formData.recommendedScenarios,
        critical_exclusions: typeof formData.criticalExclusions === 'string' ? formData.criticalExclusions.split('\n').map(x => x.trim()).filter(Boolean) : formData.criticalExclusions,
        technical_example: formData.technicalExample || '',
        steps: formData.steps || [],
        results: formData.results || '',
        metrics: formData.metrics || '',
        prompt_vars: typeof formData.promptVars === 'string' ? formData.promptVars.split(',').map(x => x.trim()).filter(Boolean) : formData.promptVars
      };
    }

    try {
      if (config.provider === 'localStorage') {
        const localItems = [...items];
        if (isEditing) {
          const idx = localItems.findIndex(i => i.id === selectedId);
          if (idx !== -1) {
            localItems[idx] = { ...localItems[idx], ...formData, id: selectedId, isDraft: finalDraftStatus };
          }
        } else {
          const newItem = { ...formData, id: `${activeModule}-${Date.now()}`, isDraft: finalDraftStatus };
          localItems.unshift(newItem);
        }
        localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(localItems));
        setItems(localItems);
      } else {
        if (isEditing) {
          await service.updateItem(activeModule, selectedId, formattedData);
        } else {
          await service.createItem(activeModule, formattedData);
        }
        await fetchCMSData();
      }

      // Reset Form
      setIsEditing(false);
      setSelectedId(null);
      setShowForm(false);
      setFormData({
        title: '',
        category: 'Diseño & Marca',
        description: '',
        tools: [],
        isDraft: false,
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
        brandName: '',
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
    } catch (err) {
      if (err.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      } else {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  const startEdit = (item) => {
    setIsEditing(true);
    setSelectedId(item.id);
    if (activeModule === 'design_tokens') {
      setFormData({
        brandName: item.brandName || '',
        colors: (item.colors && item.colors.length > 0) ? item.colors : [{ hex: '', role: '', description: '' }],
        typographies: (item.typographies && item.typographies.length > 0) ? item.typographies : [{ fontFamily: '', weights: [], fontSize: '', sampleText: '' }],
        logos: (item.logos && item.logos.length > 0) ? item.logos : [{ name: '', svgContent: '' }],
        isDraft: item.isDraft || false,
        title: '',
        category: 'Diseño & Marca',
        description: '',
        tools: [],
        prompt: '',
        problems: '',
        benefits: '',
        steps: [{ label: '', detail: '' }],
        results: '',
        metrics: '',
        promptVars: ''
      });
    } else {
      setFormData({
        title: item.title || '',
        category: item.category || 'Diseño & Marca',
        description: item.description || '',
        tools: item.tools || [],
        isDraft: item.isDraft || false,
        prompt: item.prompt || '',
        problems: (item.problems || []).join('\n'),
        benefits: (item.benefits || []).join('\n'),
        recommendedScenarios: (item.recommendedScenarios || []).join('\n'),
        criticalExclusions: (item.criticalExclusions || []).join('\n'),
        technicalExample: item.technicalExample || '',
        steps: (item.steps && item.steps.length > 0) ? item.steps : [{ label: '', detail: '' }],
        results: item.results || '',
        metrics: item.metrics || '',
        promptVars: (item.promptVars || []).join(', '),
        brandName: '',
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
    }

    if (activeModule === 'design_tokens') {
      const hasColor = !!(item.colors && item.colors.length > 0 && item.colors.some(c => (c.hex || '').trim() || (c.role || '').trim()));
      const hasTypography = !!(item.typographies && item.typographies.length > 0 && item.typographies.some(t => (t.fontFamily || '').trim()));
      const hasLogo = !!(item.logos && item.logos.length > 0 && item.logos.some(l => (l.name || '').trim() || (l.svgContent || '').trim()));

      setActivePanels({
        steps: false,
        problems: false,
        metrics: false,
        prompt: false,
        color: hasColor,
        typography: hasTypography,
        logo: hasLogo
      });

      setExpandedSections({
        identity: true,
        steps: false,
        problems: false,
        metrics: false,
        prompt: false,
        color: hasColor,
        typography: hasTypography,
        logo: hasLogo
      });
    } else {
      const hasSteps = !!(item.steps && item.steps.length > 0 && item.steps.some(s => (s.label || '').trim() || (s.detail || '').trim()));
      const hasProblems = !!((item.problems && item.problems.length > 0) || (item.benefits && item.benefits.length > 0));
      const hasMetrics = !!((item.results && item.results.trim()) || (item.metrics && item.metrics.trim()));
      const hasPrompt = !!(item.prompt && item.prompt.trim());
      const hasScenarios = !!((item.recommendedScenarios && item.recommendedScenarios.length > 0) || (item.criticalExclusions && item.criticalExclusions.length > 0));
      const hasCode = !!(item.technicalExample && item.technicalExample.trim());

      setActivePanels({
        steps: hasSteps,
        problems: hasProblems,
        metrics: hasMetrics,
        prompt: hasPrompt,
        scenarios: hasScenarios,
        code: hasCode,
        color: false,
        typography: false,
        logo: false
      });

      setExpandedSections({
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
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      if (config.provider === 'localStorage') {
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(filtered));
        setItems(filtered);
      } else {
        await service.deleteItem(activeModule, id);
        await fetchCMSData();
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      } else {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      title: "Ejemplo de Término",
      category: "Diseño & Marca",
      description: "Una descripción breve pero concisa del término.",
      steps: [
        {
          label: "Paso 1: Inicialización",
          detail: "Detalles del primer paso de implementación."
        }
      ],
      problems: [
        "Problema de ejemplo 1",
        "Problema de ejemplo 2"
      ],
      benefits: [
        "Beneficio de ejemplo 1",
        "Beneficio de ejemplo 2"
      ],
      tools: [
        "Figma",
        "React"
      ],
      results: "Entregable final esperado.",
      metrics: "Métricas para medir el impacto.",
      recommendedScenarios: [
        "Pantallas iterativas de planificación (Cartas Gantt, matrices RACI).",
        "Formularios extensos o fichas de configuración general."
      ],
      criticalExclusions: [
        "Colaboración multiusuario en tiempo real (provoca conflictos de sobreescritura).",
        "Creación o eliminación de entidades principales.",
        "Flujos financieros, transaccionales o de aprobación crítica."
      ],
      technicalExample: "// Hook de ciclo de vida estándar...\nuseEffect(() => {\n  return () => {\n    if (hasChangesRef.current) {\n      persistDataInDatabase(localStateRef.current);\n    }\n  };\n}, []);",
      prompt: "Actúa como un experto en [industria]...",
      promptVars: [
        "industria"
      ],
      isDraft: true
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([template], null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `plantilla_${activeModule}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        
        setLoadingData(true);
        for (const item of list) {
          const formattedData = {
            title: item.title || "Término importado",
            category: item.category || "Diseño & Marca",
            description: item.description || "",
            is_draft: item.isDraft !== undefined ? item.isDraft : true,
            prompt: item.prompt || "",
            tools: Array.isArray(item.tools) ? item.tools : [],
            problems: Array.isArray(item.problems) ? item.problems : [],
            benefits: Array.isArray(item.benefits) ? item.benefits : [],
            recommended_scenarios: Array.isArray(item.recommendedScenarios) ? item.recommendedScenarios : [],
            critical_exclusions: Array.isArray(item.criticalExclusions) ? item.criticalExclusions : [],
            technical_example: item.technicalExample || '',
            steps: Array.isArray(item.steps) ? item.steps : [],
            results: item.results || "",
            metrics: item.metrics || "",
            prompt_vars: Array.isArray(item.promptVars) ? item.promptVars : []
          };
          
          if (config.provider === 'localStorage') {
            const localItems = JSON.parse(localStorage.getItem(`glosaurio_${activeModule}`) || "[]");
            const newItem = { ...formattedData, id: `term-${Date.now()}-${Math.random()}` };
            localItems.unshift(newItem);
            localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(localItems));
          } else {
            await service.createItem(activeModule, formattedData);
          }
        }
        alert("¡Datos importados con éxito!");
        await fetchCMSData();
      } catch (err) {
        alert("Error al importar el JSON: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleUploadFormTemplate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!item) return;
        
        setFormData({
          title: item.title || '',
          category: item.category || 'Diseño & Marca',
          description: item.description || '',
          tools: Array.isArray(item.tools) ? item.tools : [],
          isDraft: item.isDraft !== undefined ? item.isDraft : true,
          prompt: item.prompt || '',
          problems: Array.isArray(item.problems) ? item.problems.join('\n') : (item.problems || ''),
          benefits: Array.isArray(item.benefits) ? item.benefits.join('\n') : (item.benefits || ''),
          recommendedScenarios: Array.isArray(item.recommendedScenarios) ? item.recommendedScenarios.join('\n') : (item.recommendedScenarios || ''),
          criticalExclusions: Array.isArray(item.criticalExclusions) ? item.criticalExclusions.join('\n') : (item.criticalExclusions || ''),
          technicalExample: item.technicalExample || '',
          steps: Array.isArray(item.steps) ? item.steps : [{ label: '', detail: '' }],
          results: item.results || '',
          metrics: item.metrics || '',
          promptVars: Array.isArray(item.promptVars) ? item.promptVars.join(', ') : (item.prompt_vars ? item.prompt_vars.join(', ') : (item.promptVars || ''))
        });

        const hasSteps = !!(item.steps && item.steps.length > 0 && item.steps.some(s => (s.label || '').trim() || (s.detail || '').trim()));
        const hasProblems = !!((item.problems && item.problems.length > 0) || (item.benefits && item.benefits.length > 0));
        const hasMetrics = !!((item.results && item.results.trim()) || (item.metrics && item.metrics.trim()));
        const hasPrompt = !!(item.prompt && item.prompt.trim());
        const hasScenarios = !!((item.recommendedScenarios && item.recommendedScenarios.length > 0) || (item.criticalExclusions && item.criticalExclusions.length > 0));
        const hasCode = !!(item.technicalExample && item.technicalExample.trim());

        setActivePanels({
          steps: hasSteps,
          problems: hasProblems,
          metrics: hasMetrics,
          prompt: hasPrompt,
          scenarios: hasScenarios,
          code: hasCode,
          color: false,
          typography: false,
          logo: false
        });

        setExpandedSections({
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
        });

        alert("¡Formulario rellenado desde el archivo JSON!");
      } catch (err) {
        alert("Error al cargar el JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Render Login View if not authenticated
  if (!session && config.provider === 'supabase') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card space-y-6">
        <div className="text-center">
          <span className="text-5xl block mb-2">🔒</span>
          <h2 className="font-headline-md text-[var(--on-surface)]">Área Privada CRM</h2>
          <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Inicia sesión para gestionar el contenido.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-label-md block mb-1 text-[var(--on-surface-variant)]">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@glosaurio.com"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="font-label-md block mb-1 text-[var(--on-surface-variant)]">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input w-full"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--error)_15%,transparent)] border border-[var(--error)] text-xs text-[var(--error)]">
              ⚠️ {authError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loadingAuth}
            className="btn-primary w-full justify-center py-3 flex items-center gap-2"
          >
            {loadingAuth ? (
              <span className="material-symbols-outlined spin text-lg">sync</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">login</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Active Workspace
  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--outline-variant)] pb-4 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {showForm && (
            <button 
              onClick={() => {
                setIsEditing(false);
                setSelectedId(null);
                setShowForm(false);
              }}
              className="btn-icon shrink-0" 
              title="Volver al listado"
              style={{ width: '36px', height: '36px' }}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-[var(--on-surface)] whitespace-nowrap">
            {showForm 
              ? (activeModule === 'design_tokens' ? 'Editor de Design Tokens' : 'Editor de Término')
              : (activeModule === 'design_tokens' ? 'Gestión de Design Tokens / Marca' : 'Panel de Control de Alexandria')}
          </h2>
          
          {/* Module Selector Tabs next to title */}
          {config.activeModules && config.activeModules.length > 1 && (
            <div className="flex gap-1 p-0.5 rounded-lg w-fit bg-[var(--surface-container-high)]">
              {config.activeModules.map(modKey => {
                const label = modKey === 'design_tokens' ? '🎨 Tokens' : (modKey === 'terms' ? '📚 Glosario' : modKey);
                const isActive = activeModule === modKey;
                return (
                  <button
                    key={modKey}
                    onClick={() => {
                      setActiveModule(modKey);
                      setShowForm(false);
                      setIsEditing(false);
                    }}
                    className={`tab-btn ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? 'var(--primary-container)' : 'transparent',
                      color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Action Row */}
        <div className="flex flex-wrap items-center gap-3">
          {showForm ? (
            <>
              {/* Dropdown for Plantilla actions */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)} 
                  className="btn-secondary flex items-center gap-2"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <span className="material-symbols-outlined text-sm">folder_open</span>
                  Plantilla
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                {templateDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-max rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] shadow-lg z-50 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadTemplate();
                        setTemplateDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Descargar Plantilla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('form-template-input').click();
                        setTemplateDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      Cargar Plantilla
                    </button>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="form-template-input" 
                accept=".json" 
                className="hidden" 
                onChange={handleUploadFormTemplate}
              />
              <button 
                type="button" 
                onClick={(e) => handleSave(e, true)} 
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Guardar Borrador
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSave(e, false)} 
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <span className="material-symbols-outlined text-sm">publish</span>
                {activeModule === 'design_tokens' ? 'Publicar Token' : 'Publicar en Glosario'}
              </button>
            </>
          ) : (
            <span className="chip chip-neutral font-mono uppercase tracking-wider text-xs">Provider: {config.provider}</span>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* MAIN FORM: (9 cols) */}
            <div className="lg:col-span-9 space-y-6">
              {activeModule === 'design_tokens' ? (
                <>
                  {/* Token Identity Section */}
                  <section id="sec-identity" className="glass-panel p-8">
                    <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>palette</span>
                      Identidad del Sistema de Diseño
                    </h2>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nombre de la Marca *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.brandName}
                          onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                          placeholder="Ej: Glosaurio, Nike" 
                          className="form-input" 
                        />
                      </div>
                    </div>
                  </section>

                  {/* Conditional Token Settings Section */}
                  {activePanels.color && (
                    <section id="sec-color" className="glass-panel p-8 space-y-6">
                      <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>color_lens</span>
                          Paleta de Colores
                        </h2>
                        <button 
                          type="button" 
                          onClick={addColor}
                          className="btn-secondary text-xs flex items-center gap-1"
                          style={{ padding: '6px 12px' }}
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Añadir Color
                        </button>
                      </div>
                      <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
                        {(formData.colors || []).map((color, idx) => (
                          <div key={idx} className="pt-6 first:pt-0 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="chip chip-neutral text-xs font-mono">Color #{idx + 1}</span>
                              {(formData.colors || []).length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => removeColor(idx)}
                                  className="btn-icon text-[var(--error)]"
                                  title="Eliminar este color"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Código Color (HEX/RGB/HSL)</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={color.hex || ''}
                                    onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                                    placeholder="Ej: #2563EB" 
                                    className="form-input flex-1" 
                                  />
                                  <div 
                                    className="w-12 h-12 rounded-xl border border-[var(--outline-variant)] shadow-sm shrink-0"
                                    style={{ backgroundColor: color.hex || 'transparent' }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Rol / Nombre del Color</label>
                                <input 
                                  type="text" 
                                  value={color.role || ''}
                                  onChange={(e) => handleColorChange(idx, 'role', e.target.value)}
                                  placeholder="Ej: Primary Button, Text Accent" 
                                  className="form-input" 
                                />
                              </div>
                              <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción de la Paleta & Uso</label>
                                <textarea 
                                  value={color.description || ''}
                                  onChange={(e) => handleColorChange(idx, 'description', e.target.value)}
                                  placeholder="Describe cómo y cuándo debe utilizarse este color..." 
                                  rows="3"
                                  className="form-textarea"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {activePanels.typography && (
                    <section id="sec-typography" className="glass-panel p-8 space-y-6">
                      <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>text_fields</span>
                          Tipografías
                        </h2>
                        <button 
                          type="button" 
                          onClick={addTypography}
                          className="btn-secondary text-xs flex items-center gap-1"
                          style={{ padding: '6px 12px' }}
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Añadir Fuente
                        </button>
                      </div>
                      <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
                        {(formData.typographies || []).map((typo, idx) => (
                          <div key={idx} className="pt-6 first:pt-0 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="chip chip-neutral text-xs font-mono">Fuente #{idx + 1}</span>
                              {(formData.typographies || []).length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => removeTypography(idx)}
                                  className="btn-icon text-[var(--error)]"
                                  title="Eliminar esta fuente"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Google Font Family</label>
                                <input 
                                  type="text" 
                                  value={typo.fontFamily || ''}
                                  onChange={(e) => handleTypographyChange(idx, 'fontFamily', e.target.value)}
                                  placeholder="Ej: Plus Jakarta Sans o Inter" 
                                  className="form-input" 
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Tamaño de Fuente (Base)</label>
                                <input 
                                  type="text" 
                                  value={typo.fontSize || ''}
                                  onChange={(e) => handleTypographyChange(idx, 'fontSize', e.target.value)}
                                  placeholder="Ej: 16px o 1.25rem" 
                                  className="form-input" 
                                />
                              </div>
                              <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Pesos Disponibles (Separados por coma)</label>
                                <input 
                                  type="text" 
                                  value={Array.isArray(typo.weights) ? typo.weights.join(', ') : typo.weights || ''}
                                  onChange={(e) => handleTypographyChange(idx, 'weights', e.target.value.split(',').map(x => x.trim()))}
                                  placeholder="Ej: 400, 600, 700" 
                                  className="form-input" 
                                />
                              </div>
                              <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Texto de Muestra</label>
                                <textarea 
                                  value={typo.fontSampleText || ''}
                                  onChange={(e) => handleTypographyChange(idx, 'fontSampleText', e.target.value)}
                                  placeholder="Muestra de texto para probar la tipografía..." 
                                  rows="3"
                                  className="form-textarea"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {activePanels.logo && (
                    <section id="sec-logo" className="glass-panel p-8 space-y-6">
                      <div className="flex justify-between items-center border-b border-[var(--outline-variant)] pb-4">
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>crop_schema</span>
                          Logos SVG
                        </h2>
                        <button 
                          type="button" 
                          onClick={addLogo}
                          className="btn-secondary text-xs flex items-center gap-1"
                          style={{ padding: '6px 12px' }}
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Añadir Logo
                        </button>
                      </div>
                      <div className="space-y-6 divide-y divide-[var(--outline-variant)]">
                        {(formData.logos || []).map((logo, idx) => (
                          <div key={idx} className="pt-6 first:pt-0 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="chip chip-neutral text-xs font-mono">Logo #{idx + 1}</span>
                              {(formData.logos || []).length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => removeLogo(idx)}
                                  className="btn-icon text-[var(--error)]"
                                  title="Eliminar este logo"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Nombre del Logotipo</label>
                                <input 
                                  type="text" 
                                  value={logo.name || ''}
                                  onChange={(e) => handleLogoChange(idx, 'name', e.target.value)}
                                  placeholder="Ej: Logo Principal, Isotipo, Logo Versión Oscura" 
                                  className="form-input" 
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Código SVG Crudo</label>
                                <div className="code-editor">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-2">
                                      <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                                      <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                                      <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                                    </div>
                                    <span className="font-caption text-[var(--outline)]">logo-{idx + 1}.svg</span>
                                  </div>
                                  <textarea 
                                    value={logo.svgContent || ''}
                                    onChange={(e) => handleLogoChange(idx, 'svgContent', e.target.value)}
                                    placeholder="<svg viewBox='0 0 100 100' ...>&#10;  <path ... />&#10;</svg>" 
                                    rows="10" 
                                    spellCheck="false"
                                    className="code-textarea"
                                  />
                                </div>
                              </div>

                              {/* SVG Live Preview */}
                              {logo.svgContent && (
                                <div className="flex flex-col gap-2">
                                  <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Previsualización SVG</label>
                                  <div 
                                    className="p-8 rounded-2xl flex items-center justify-center border border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-low)] min-h-[140px] max-h-[260px] overflow-auto"
                                    dangerouslySetInnerHTML={{ __html: logo.svgContent }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <>
                  {/* Identity Section */}
                  <section id="sec-identity" className="glass-panel p-8">
                    <h2 className="font-headline-sm mb-6 flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>fingerprint</span>
                      Identidad del Término
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Título del Término *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ej: Vibe Coding Essentials" 
                          className="form-input font-headline-sm" 
                          style={{ fontSize: '1.1rem' }}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Categoría *</label>
                        <div className="relative">
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="form-select"
                          >
                            <option value="Diseño & Marca">🎨 Diseño &amp; Marca</option>
                            <option value="Vibe Coding">⚡ Vibe Coding</option>
                            <option value="Gestión">📋 Gestión de Proyectos</option>
                            <option value="Automatización">🤖 Automatización</option>
                            <option value="Tech">🔧 Tech &amp; Tooling</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg" style={{ color: 'var(--outline)' }}>expand_more</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Descripción Corta *</label>
                        <textarea 
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descripción del término que aparecerá en la tarjeta del glosario..." 
                          rows="3"
                          className="form-textarea"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Process Steps Section */}
                  {activePanels.steps && (
                    <section id="sec-steps" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('steps')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>route</span>
                          Proceso Paso a Paso
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.steps ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.steps ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, steps: false }));
                              setFormData(prev => ({ ...prev, steps: [{ label: '', detail: '' }] }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.steps ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.steps && (
                        <div className="space-y-4">
                          {(formData.steps || []).map((step, idx) => (
                            <div key={idx} className="p-4 rounded-xl space-y-2 relative" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                              <div className="flex items-center justify-between">
                                <span className="font-caption uppercase tracking-wider text-xs" style={{ color: 'var(--outline)' }}>Paso {idx + 1}</span>
                                {formData.steps.length > 1 && (
                                  <button 
                                    type="button" 
                                    onClick={() => removeStep(idx)}
                                    className="text-[var(--error)] hover:underline flex items-center gap-1 text-xs"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                    Quitar
                                  </button>
                                )}
                              </div>
                              <input 
                                type="text" 
                                value={step.label}
                                onChange={(e) => handleStepChange(idx, 'label', e.target.value)}
                                placeholder="Título del paso" 
                                className="form-input text-sm"
                                style={{ padding: '10px 14px' }}
                              />
                              <textarea 
                                value={step.detail}
                                onChange={(e) => handleStepChange(idx, 'detail', e.target.value)}
                                placeholder="Descripción del paso..." 
                                rows="2"
                                className="form-textarea text-sm"
                                style={{ padding: '10px 14px' }}
                              />
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={addStep} 
                            className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Agregar Paso
                          </button>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Problems Section */}
                  {activePanels.problems && (
                    <section id="sec-problems" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('problems')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>balance</span>
                          Problemas y Beneficios
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.problems ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.problems ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, problems: false }));
                              setFormData(prev => ({ ...prev, problems: '', benefits: '' }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.problems ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.problems && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Problemas que Resuelve (uno por línea)</label>
                            <textarea 
                              value={formData.problems}
                              onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
                              placeholder="Ej: Decisiones de diseño lentas&#10;Ciclos de feedback muy largos" 
                              rows="4"
                              className="form-textarea text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Beneficios Clave (uno por línea)</label>
                            <textarea 
                              value={formData.benefits}
                              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                              placeholder="Ej: Reduce semanas de trabajo a días&#10;Valida ideas rápidamente" 
                              rows="4"
                              className="form-textarea text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Results & Metrics Section */}
                  {activePanels.metrics && (
                    <section id="sec-metrics" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('metrics')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>insights</span>
                          Resultados y Métricas
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.metrics ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.metrics ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, metrics: false }));
                              setFormData(prev => ({ ...prev, results: '', metrics: '' }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.metrics ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.metrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Entregables Esperados</label>
                            <textarea 
                              value={formData.results}
                              onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                              placeholder="¿Qué se obtiene al aplicar este término?" 
                              rows="4"
                              className="form-textarea"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label class="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Métricas de Éxito</label>
                            <textarea 
                              value={formData.metrics}
                              onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                              placeholder="¿Cómo saber si se aplicó correctamente?" 
                              rows="4"
                              className="form-textarea"
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Prompt Template Section */}
                  {activePanels.prompt && (
                    <section id="sec-prompt" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('prompt')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>prompt_suggestion</span>
                          Prompt Template
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.prompt ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.prompt ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, prompt: false }));
                              setFormData(prev => ({ ...prev, prompt: '', promptVars: '' }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.prompt ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.prompt && (
                        <>
                          <div className="flex flex-col gap-2 mb-4">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Variables rápidas (separadas por coma)</label>
                            <input 
                              type="text" 
                              value={formData.promptVars}
                              onChange={(e) => setFormData({ ...formData, promptVars: e.target.value })}
                              placeholder="Ej: nombre_marca, industria, tono" 
                              className="form-input"
                            />
                          </div>
                          <div className="code-editor">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                                <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                                <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                              </div>
                              <span className="font-caption text-[var(--outline)]">prompt.md</span>
                            </div>
                            <textarea 
                              value={formData.prompt}
                              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                              placeholder="/* Escribe aquí el prompt template */&#10;&#10;Actúa como un experto en [campo].&#10;Tu objetivo es..." 
                              rows="10" 
                              spellCheck="false"
                              className="code-textarea"
                            />
                          </div>
                        </>
                      )}
                    </section>
                  )}

                  {/* Scenarios Section */}
                  {activePanels.scenarios && (
                    <section id="sec-scenarios" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('scenarios')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>check_circle</span>
                          Casos de Uso y Contraindicaciones
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.scenarios ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.scenarios ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, scenarios: false }));
                              setFormData(prev => ({ ...prev, recommendedScenarios: '', criticalExclusions: '' }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.scenarios ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.scenarios && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dónde SÍ aplicarlo / Casos de Uso Ideales (uno por línea)</label>
                            <textarea 
                              value={formData.recommendedScenarios}
                              onChange={(e) => setFormData({ ...formData, recommendedScenarios: e.target.value })}
                              placeholder="Ej: Pantallas iterativas de planificación (Cartas Gantt, matrices RACI)&#10;Formularios extensos o fichas de configuración" 
                              rows="4"
                              className="form-textarea text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="font-label-md" style={{ color: 'var(--on-surface-variant)' }}>Dónde NO aplicarlo / Contraindicaciones (uno por línea)</label>
                            <textarea 
                              value={formData.criticalExclusions}
                              onChange={(e) => setFormData({ ...formData, criticalExclusions: e.target.value })}
                              placeholder="Ej: Colaboración multiusuario en tiempo real&#10;Creación o eliminación de entidades principales" 
                              rows="4"
                              className="form-textarea text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Technical Example / Code Snippet Section */}
                  {activePanels.code && (
                    <section id="sec-code" className="glass-panel p-8">
                      <div className="flex items-center justify-between cursor-pointer select-none mb-6" onClick={() => toggleSection('code')}>
                        <h2 className="font-headline-sm flex items-center gap-2" style={{ color: 'var(--on-surface)', margin: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>code</span>
                          Snippet de Código / Ejemplo Técnico
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${expandedSections.code ? 'chip-primary' : 'chip-neutral'}`}>{expandedSections.code ? 'Desplegado' : 'Plegado'}</span>
                          <HoldToConfirmButton 
                            onConfirm={() => {
                              setActivePanels(prev => ({ ...prev, code: false }));
                              setFormData(prev => ({ ...prev, technicalExample: '' }));
                            }}
                            className="btn-icon text-[var(--error)]"
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px' }}
                            title="Mantén presionado para quitar sección"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </HoldToConfirmButton>
                          <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: expandedSections.code ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </div>
                      </div>
                      {expandedSections.code && (
                        <div className="code-editor">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2">
                              <span className="w-3 h-3 rounded-full bg-[var(--error)]"></span>
                              <span className="w-3 h-3 rounded-full bg-[var(--secondary)]"></span>
                              <span className="w-3 h-3 rounded-full bg-[var(--primary)]"></span>
                            </div>
                            <span className="font-caption text-[var(--outline)]">example.ts</span>
                          </div>
                          <textarea 
                            value={formData.technicalExample}
                            onChange={(e) => setFormData({ ...formData, technicalExample: e.target.value })}
                            placeholder="// Escribe aquí tu snippet de código o implementación estándar..." 
                            rows="10" 
                            spellCheck="false"
                            className="code-textarea"
                          />
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}
            </div>

            {/* SIDEBAR: (3 cols) */}
            <aside className="lg:col-span-3 space-y-6">
              {activeModule === 'design_tokens' ? (
                <div className="space-y-6">
                  {/* Secciones Disponibles para Design Tokens */}
                  {(!activePanels.color || !activePanels.typography || !activePanels.logo) && (
                    <div className="glass-panel p-6">
                      <h3 className="font-headline-sm mb-4 text-[var(--on-surface)]">Añadir Secciones</h3>
                      <p className="text-xs text-[var(--on-surface-variant)] mb-3">Haz clic en un componente para agregarlo a tu sistema de diseño:</p>
                      <div className="flex flex-col gap-2">
                        {!activePanels.color && (
                          <span onClick={() => { setActivePanels(p => ({...p, color: true})); setExpandedSections(s => ({...s, color: true})); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">color_lens</span>
                              Paleta de Colores
                            </span>
                            <span className="material-symbols-outlined text-sm">add</span>
                          </span>
                        )}
                        {!activePanels.typography && (
                          <span onClick={() => { setActivePanels(p => ({...p, typography: true})); setExpandedSections(s => ({...s, typography: true})); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">text_fields</span>
                              Tipografía
                            </span>
                            <span className="material-symbols-outlined text-sm">add</span>
                          </span>
                        )}
                        {!activePanels.logo && (
                          <span onClick={() => { setActivePanels(p => ({...p, logo: true})); setExpandedSections(s => ({...s, logo: true})); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">crop_schema</span>
                              Logo SVG
                            </span>
                            <span className="material-symbols-outlined text-sm">add</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="glass-panel p-6 space-y-4">
                    <h3 className="font-headline-sm text-[var(--on-surface)]">Guía de Formatos</h3>
                    <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                      <strong>Colores:</strong> Usa HEX (#000000), HSL o RGB. Se previsualizará automáticamente si el formato es válido.
                    </p>
                    <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                      <strong>Tipografía:</strong> La fuente de Google Fonts debe ingresarse con su nombre exacto (ej. "Plus Jakarta Sans") para ser cargada de manera dinámica.
                    </p>
                    <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                      <strong>Logo SVG:</strong> Inserta el código XML crudo del SVG. Asegúrate de incluir el atributo <code>viewBox</code> para un escalado responsivo.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Secciones Disponibles */}
                  {activeModule !== 'design_tokens' && Object.values(activePanels).includes(false) && (
                    <div className="glass-panel p-6">
                      <h3 className="font-headline-sm mb-2 text-[var(--on-surface)]">Añadir Secciones</h3>
                      <p className="text-xs text-[var(--on-surface-variant)] mb-4">Haz clic en una sección para agregarla al formulario:</p>
                      <div className="flex flex-wrap gap-2">
                        {!activePanels.steps && (
                          <span onClick={() => { setActivePanels(p => ({...p, steps: true})); setExpandedSections(s => ({...s, steps: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">route</span>
                            Proceso Paso a Paso
                          </span>
                        )}
                        {!activePanels.problems && (
                          <span onClick={() => { setActivePanels(p => ({...p, problems: true})); setExpandedSections(s => ({...s, problems: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">balance</span>
                            Problemas y Beneficios
                          </span>
                        )}
                        {!activePanels.scenarios && (
                          <span onClick={() => { setActivePanels(p => ({...p, scenarios: true})); setExpandedSections(s => ({...s, scenarios: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                            Casos de Uso SÍ/NO
                          </span>
                        )}
                        {!activePanels.metrics && (
                          <span onClick={() => { setActivePanels(p => ({...p, metrics: true})); setExpandedSections(s => ({...s, metrics: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">insights</span>
                            Resultados y Métricas
                          </span>
                        )}
                        {!activePanels.prompt && (
                          <span onClick={() => { setActivePanels(p => ({...p, prompt: true})); setExpandedSections(s => ({...s, prompt: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">prompt_suggestion</span>
                            Prompt Template
                          </span>
                        )}
                        {!activePanels.code && (
                          <span onClick={() => { setActivePanels(p => ({...p, code: true})); setExpandedSections(s => ({...s, code: true})); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <span className="material-symbols-outlined text-sm mr-1">code</span>
                            Ejemplo Técnico / Código
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Associated Tools */}
                  <div className="glass-panel p-6">
                    <h3 className="font-headline-sm mb-4 text-[var(--on-surface)]">Herramientas Asociadas</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(formData.tools || []).map((t, idx) => (
                        <span key={idx} className="chip chip-primary" style={{ cursor: 'pointer' }}>
                          {t}
                          <button 
                            type="button" 
                            onClick={() => removeTool(idx)} 
                            className="btn-remove-tool ml-1 bg-transparent border-none cursor-pointer color-inherit p-0 text-[12px]"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="tool-input"
                        placeholder="Añadir herramienta..." 
                        className="form-input flex-1"
                        style={{ padding: '10px 14px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTool(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const input = document.getElementById('tool-input');
                          if (input) {
                            addTool(input.value);
                            input.value = '';
                          }
                        }}
                        className="btn-icon" 
                        title="Agregar herramienta"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Editing Banner */}
              {isEditing && (
                <div className="glass-panel p-5" style={{ borderLeft: '4px solid var(--secondary)' }}>
                  <p className="font-label-md mb-1 text-[var(--secondary)]">✏️ Modo Edición</p>
                  <p className="font-body-md text-[var(--on-surface-variant)]">Editando: "{formData.title}"</p>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedId(null);
                      setShowForm(false);
                    }} 
                    className="btn-secondary mt-3 w-full justify-center text-sm"
                    style={{ padding: '8px 14px' }}
                  >
                    Cancelar edición
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      ) : (
        /* Term List Table */
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-headline-sm">Términos Registrados</h3>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="form-input max-w-xs text-sm"
                style={{ padding: '6px 12px' }}
              />
              <button 
                onClick={handleDownloadTemplate}
                className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
                style={{ padding: '6px 16px' }}
                title="Descargar plantilla JSON"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Plantilla IA
              </button>
              <button 
                onClick={() => document.getElementById('import-file-input').click()}
                className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
                style={{ padding: '6px 16px' }}
                title="Importar JSON"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Importar JSON
              </button>
              <input 
                type="file" 
                id="import-file-input" 
                accept=".json" 
                className="hidden" 
                onChange={handleImportFile}
              />
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setSelectedId(null);
                  setFormData({
                    title: '',
                    category: 'Diseño & Marca',
                    description: '',
                    tools: [],
                    isDraft: false,
                    prompt: '',
                    problems: '',
                    benefits: '',
                    steps: [{ label: '', detail: '' }],
                    results: '',
                    metrics: '',
                    promptVars: '',
                    brandName: '',
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
                  setActivePanels({
                    steps: false,
                    problems: false,
                    metrics: false,
                    prompt: false,
                    color: false,
                    typography: false,
                    logo: false
                  });
                  setShowForm(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
                style={{ padding: '6px 16px' }}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {activeModule === 'design_tokens' ? 'Añadir Token' : 'Añadir Término'}
              </button>
            </div>
          </div>

          {loadingData ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined spin text-3xl" style={{ color: 'var(--primary)' }}>sync</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--outline-variant)] text-xs uppercase tracking-wider text-[var(--outline)]">
                    <th className="pb-3 pr-2">{activeModule === 'design_tokens' ? 'Marca / Sistema de Diseño' : 'Nombre'}</th>
                    <th className="pb-3 pr-2">{activeModule === 'design_tokens' ? 'Elementos' : 'Categoría'}</th>
                    <th className="pb-3 pr-2">Estado</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline-variant)]">
                  {items
                    .filter(i => {
                      const searchStr = activeModule === 'design_tokens'
                        ? `${i.brandName || i.brand_name || ''}`
                        : `${i.title} ${i.category}`;
                      return searchStr.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(item => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-3 font-semibold text-[var(--on-surface)] pr-2">
                          {activeModule === 'design_tokens' ? (
                            <span className="flex items-center gap-2">
                              <span>{item.brandName}</span>
                            </span>
                          ) : (
                            item.title
                          )}
                        </td>
                        <td className="py-3 text-[var(--on-surface-variant)] pr-2">
                          {activeModule === 'design_tokens' ? (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {item.colors && item.colors.length > 0 && <span className="chip chip-neutral">{item.colors.length} Colores</span>}
                              {item.typographies && item.typographies.length > 0 && <span className="chip chip-neutral">{item.typographies.length} Fuentes</span>}
                              {item.logos && item.logos.length > 0 && <span className="chip chip-neutral">{item.logos.length} Logos</span>}
                            </div>
                          ) : (
                            item.category
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`chip ${item.isDraft ? 'chip-neutral' : 'chip-tertiary'}`}>
                            {item.isDraft ? 'Borrador' : 'Publicado'}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button 
                            onClick={() => startEdit(item)}
                            className="btn-icon text-sm inline-flex items-center justify-center" 
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <HoldToConfirmButton 
                            onConfirm={() => handleDelete(item.id)}
                            className="btn-icon text-sm inline-flex items-center justify-center text-[var(--error)]" 
                            title="Mantén presionado para eliminar"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </HoldToConfirmButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

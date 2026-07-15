import React, { useState, useEffect } from 'react';

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
      headers: this._headers({ 'Prefer': '' })
    });
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return await res.json();
  }

  async createItem(collection, data) {
    const res = await fetch(`${this.url}/rest/v1/${collection}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Create error: ${res.status} - ${await res.text()}`);
    const rows = await res.json();
    return rows[0];
  }

  async updateItem(collection, id, data) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Update error: ${res.status}`);
    const rows = await res.json();
    return rows[0];
  }

  async deleteItem(collection, id) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this._headers({ 'Prefer': '' })
    });
    if (!res.ok) throw new Error(`Delete error: ${res.status}`);
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

export default function CRMControlPanel({ config }) {
  const [session, setSession] = useState(null);
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
  const [formData, setFormData] = useState({
    title: '',
    category: 'Diseño & Marca',
    description: '',
    vibeScore: 5,
    tools: '',
    isDraft: false,
    prompt: '',
    problems: '',
    benefits: ''
  });
  const [selectedId, setSelectedId] = useState(null);

  // Initialize service
  const service = config.provider === 'supabase' 
    ? new SupabaseRESTService(config.supabase, session?.token)
    : null;

  // 1. Check local session storage on load
  useEffect(() => {
    if (config.provider === 'supabase') {
      const cached = localStorage.getItem(`crm_session_${config.supabase.url}`);
      if (cached) {
        try {
          setSession(JSON.parse(cached));
        } catch (e) {
          localStorage.removeItem(`crm_session_${config.supabase.url}`);
        }
      }
    } else {
      // LocalStorage provider doesn't require session auth
      setSession({ local: true });
    }
  }, [config]);

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
      const mapped = rawItems.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        vibeScore: item.vibe_score || item.vibeScore,
        tools: Array.isArray(item.tools) ? item.tools : [],
        isDraft: item.is_draft || item.isDraft || false,
        prompt: item.prompt || '',
        problems: Array.isArray(item.problems) ? item.problems : [],
        benefits: Array.isArray(item.benefits) ? item.benefits : []
      }));
      setItems(mapped);
    } catch (e) {
      console.error('Error fetching CRM data:', e);
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
  const handleSave = async (e) => {
    e.preventDefault();
    const formattedData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      vibe_score: parseInt(formData.vibeScore),
      is_draft: formData.isDraft,
      prompt: formData.prompt,
      tools: typeof formData.tools === 'string' ? formData.tools.split(',').map(x => x.trim()).filter(Boolean) : formData.tools,
      problems: typeof formData.problems === 'string' ? formData.problems.split('\n').map(x => x.trim()).filter(Boolean) : formData.problems,
      benefits: typeof formData.benefits === 'string' ? formData.benefits.split('\n').map(x => x.trim()).filter(Boolean) : formData.benefits
    };

    try {
      if (config.provider === 'localStorage') {
        const localItems = [...items];
        if (isEditing) {
          const idx = localItems.findIndex(i => i.id === selectedId);
          if (idx !== -1) {
            localItems[idx] = { ...localItems[idx], ...formData, id: selectedId };
          }
        } else {
          const newItem = { ...formData, id: `term-${Date.now()}` };
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
      setFormData({
        title: '',
        category: 'Diseño & Marca',
        description: '',
        vibeScore: 5,
        tools: '',
        isDraft: false,
        prompt: '',
        problems: '',
        benefits: ''
      });
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const startEdit = (item) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setFormData({
      title: item.title || '',
      category: item.category || 'Diseño & Marca',
      description: item.description || '',
      vibeScore: item.vibeScore || 5,
      tools: (item.tools || []).join(', '),
      isDraft: item.isDraft || false,
      prompt: item.prompt || '',
      problems: (item.problems || []).join('\n'),
      benefits: (item.benefits || []).join('\n')
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este término?')) return;
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
      alert(`Error al eliminar: ${err.message}`);
    }
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
      <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-4">
        <div>
          <span className="chip chip-neutral font-mono uppercase tracking-wider text-xs">Provider: {config.provider}</span>
          <h2 className="font-headline-lg text-[var(--on-surface)] mt-1">Panel de Control de Alexandria</h2>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">logout</span>
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Term Creator Form */}
        <form onSubmit={handleSave} className="lg:col-span-5 glass-card p-6 space-y-4">
          <h3 className="font-headline-sm text-[var(--on-surface)]">
            {isEditing ? '✏️ Editar Término' : '➕ Añadir Término'}
          </h3>

          <div>
            <label className="font-label-md block mb-1">Título</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input w-full"
              placeholder="Ej. Design Tokens"
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Categoría</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="form-input w-full"
            >
              <option value="Diseño & Marca">Diseño & Marca</option>
              <option value="Vibe Coding">Vibe Coding</option>
              <option value="Gestión">Gestión</option>
              <option value="Automatización">Automatización</option>
              <option value="Tech">Tech</option>
            </select>
          </div>

          <div>
            <label className="font-label-md block mb-1">Descripción</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input w-full"
              rows="3"
              placeholder="Descripción breve..."
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Vibe Score: {formData.vibeScore}/10</label>
            <input 
              type="range" 
              min="1" 
              max="10"
              value={formData.vibeScore}
              onChange={(e) => setFormData({ ...formData, vibeScore: parseInt(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Herramientas (separadas por comas)</label>
            <input 
              type="text" 
              value={formData.tools}
              onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
              className="form-input w-full"
              placeholder="Ej. Figma, Notion, VS Code"
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Problemas que Resuelve (uno por línea)</label>
            <textarea 
              value={formData.problems}
              onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
              className="form-input w-full"
              rows="3"
              placeholder="Problema 1&#10;Problema 2..."
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Beneficios Clave (uno por línea)</label>
            <textarea 
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              className="form-input w-full"
              rows="3"
              placeholder="Beneficio 1&#10;Beneficio 2..."
            />
          </div>

          <div>
            <label className="font-label-md block mb-1">Prompt Template</label>
            <textarea 
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="form-input w-full font-mono text-sm"
              rows="4"
              placeholder="Actúa como experto..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isDraft}
              onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span className="font-body-md">Guardar como borrador (no publicado)</span>
          </label>

          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setSelectedId(null);
                  setFormData({
                    title: '',
                    category: 'Diseño & Marca',
                    description: '',
                    vibeScore: 5,
                    tools: '',
                    isDraft: false,
                    prompt: '',
                    problems: '',
                    benefits: ''
                  });
                }}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn-primary flex-1 justify-center">
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>

        {/* Right Side: Term List Table */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm">Términos Registrados</h3>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="form-input max-w-xs text-sm"
              style={{ padding: '6px 12px' }}
            />
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
                    <th className="pb-3 pr-2">Nombre</th>
                    <th className="pb-3 pr-2">Categoría</th>
                    <th className="pb-3 pr-2">Estado</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline-variant)]">
                  {items
                    .filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-3 font-semibold text-[var(--on-surface)] pr-2">{item.title}</td>
                        <td className="py-3 text-[var(--on-surface-variant)] pr-2">{item.category}</td>
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
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="btn-icon text-sm inline-flex items-center justify-center text-[var(--error)]" 
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

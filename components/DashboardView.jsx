import React from 'react';

export default function DashboardView({
  config,
  stats,
  loading,
  setActiveModule,
  setShowForm,
  setCreatingTypeSelected,
  setIsEditing,
  setSelectedId
}) {
  const activeModules = config.activeModules || ['terms', 'design_tokens'];
  
  // Icon and display mappings
  const moduleInfo = {
    terms: {
      title: 'Conceptos / Glosario',
      description: 'Patrones de código, guías paso a paso, prompt templates y vídeos de desarrollo.',
      icon: 'menu_book',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      label: 'Concepto'
    },
    design_tokens: {
      title: 'UI Kit / Marca',
      description: 'Sistema de diseño, paleta de colores, tipografías y recursos de marca.',
      icon: 'palette',
      color: '#bb864e', // secondary
      bg: 'rgba(187, 134, 78, 0.15)',
      label: 'UI Kit'
    },
    travel: {
      title: 'Gestión de Viajes',
      description: 'Creación, edición y publicación de itinerarios y tours a medida.',
      icon: 'flight_takeoff',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      label: 'Viaje'
    },
    location: {
      title: 'Gestión de Destinos',
      description: 'Administración de locaciones, atracciones turísticas y guías locales.',
      icon: 'map',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.15)',
      label: 'Destino'
    },
    departure: {
      title: 'Salidas Programadas',
      description: 'Calendario de fechas de salida, capacidades, reservas y estados.',
      icon: 'calendar_month',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      label: 'Salida'
    },
    products: {
      title: 'Gestión de Productos',
      description: 'Administración de productos turísticos y servicios adicionales.',
      icon: 'shopping_bag',
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.15)',
      label: 'Producto'
    }
  };

  const getModuleConfig = (key) => {
    return moduleInfo[key] || {
      title: key.charAt(0).toUpperCase() + key.slice(1),
      description: `Administración del módulo ${key}.`,
      icon: 'extension',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      label: key
    };
  };

  const handleAddNew = (modKey) => {
    setActiveModule(modKey);
    if (setSelectedId) setSelectedId(null);
    if (setIsEditing) setIsEditing(false);
    // For terms/design_tokens creation starts with type selection
    if (modKey === 'terms' || modKey === 'design_tokens') {
      setCreatingTypeSelected(false);
    } else {
      setCreatingTypeSelected(true);
    }
    setShowForm(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Card */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--outline)]">
        <div className="space-y-2 z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--on-surface)] tracking-tight">
            ¡Hola, Andreia! 👋
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] max-w-xl">
            Bienvenido al panel centralizado de administración de <span className="font-semibold text-[var(--primary)]">{config.branding?.appName || 'Sueño Travel'}</span>. Desde aquí puedes gestionar todo el contenido, diseño y viajes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          <div className="chip chip-neutral text-xs py-2 px-4 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--tertiary)] animate-pulse"></span>
            Proveedor: <strong className="uppercase">{config.provider}</strong>
          </div>
        </div>
        {/* Decorative subtle light circles */}
        <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-[var(--primary-container)] blur-3xl opacity-50 pointer-events-none"></div>
      </div>

      {/* Grid of active modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--on-surface)] flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[var(--primary)]">grid_view</span>
          Módulos Activos en el Sistema
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeModules.map(modKey => {
            const m = getModuleConfig(modKey);
            const count = stats[modKey] ?? 0;
            return (
              <div 
                key={modKey} 
                className="glass-panel p-6 flex flex-col justify-between hover:border-[var(--primary)] hover:shadow-lg transition-all border border-[var(--outline)]"
                style={{ background: 'var(--surface-container-lowest)' }}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: m.color, boxShadow: `0 4px 14px 0 ${m.color}33` }}
                    >
                      <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                    </div>
                    {loading ? (
                      <span className="text-xs text-[var(--text-muted)] animate-pulse">Cargando...</span>
                    ) : (
                      <span className="text-xl font-extrabold text-[var(--on-surface)] flex items-baseline gap-1">
                        {count}
                        <span className="text-xs font-normal text-[var(--on-surface-variant)]">reg.</span>
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="space-y-1">
                    <h3 className="font-headline-sm font-bold text-[var(--on-surface)]">{m.title}</h3>
                    <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 min-h-[32px]">
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[var(--outline)]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule(modKey);
                      setShowForm(false);
                      if (setIsEditing) setIsEditing(false);
                    }}
                    className="btn-secondary w-full justify-center text-xs"
                    style={{ padding: '8px 12px' }}
                  >
                    <span className="material-symbols-outlined text-xs mr-1">list</span>
                    Ver Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNew(modKey)}
                    className="btn-primary w-full justify-center text-xs text-white"
                    style={{ padding: '8px 12px', backgroundColor: m.color, borderColor: m.color }}
                  >
                    <span className="material-symbols-outlined text-xs mr-1">add</span>
                    Añadir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Tips / General Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4 border border-[var(--outline)]">
          <h3 className="font-headline-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[var(--secondary)]">bolt</span>
            Acciones de Configuración Rápida
          </h3>
          <p className="text-xs text-[var(--on-surface-variant)]">
            Acceso directo a herramientas técnicas para verificar el estado de la base de datos o modificar la inicialización del sistema.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="setup.html" 
              className="btn-secondary text-xs flex items-center gap-1"
              style={{ padding: '8px 16px', textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined text-xs">build</span>
              Asistente Setup
            </a>
            <a 
              href="settings.html" 
              className="btn-secondary text-xs flex items-center gap-1"
              style={{ padding: '8px 16px', textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined text-xs">settings</span>
              Configuración
            </a>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4 border border-[var(--outline)]">
          <h3 className="font-headline-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[var(--tertiary)]">info</span>
            Guía Rápida del Editor
          </h3>
          <ul className="text-xs text-[var(--on-surface-variant)] space-y-2 list-disc list-inside">
            <li>Los cambios en <strong>UI Kit / Marca</strong> modifican directamente los estilos visuales del sitio web.</li>
            <li>Al crear <strong>Conceptos / Guías</strong>, el sistema genera automáticamente las estructuras SEO para optimizar su búsqueda.</li>
            <li>Los itinerarios de <strong>Viajes</strong> pueden guardarse como borrador antes de su publicación definitiva.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

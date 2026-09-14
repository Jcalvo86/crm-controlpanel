import React from 'react';

export default function BlogFormEditor({ formData, setFormData }) {
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = e.target.value.trim().replace(',', '');
      if (newTag && !formData.tags?.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (index) => {
    setFormData(prev => {
      const newTags = [...(prev.tags || [])];
      newTags.splice(index, 1);
      return { ...prev, tags: newTags };
    });
  };

  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="glass-panel p-6 space-y-6">
        <h3 className="font-headline-sm text-[var(--on-surface)] border-b border-[var(--outline-variant)] pb-3">Información General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="title" className="form-label">Título del Artículo *</label>
            <input type="text" id="title" value={formData.title || ''} onChange={handleChange} className="form-input" required placeholder="Ej: Cómo viajar a Egipto..." />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="form-label flex justify-between">
              <span>URL (Slug) *</span>
              <button type="button" onClick={generateSlug} className="text-xs text-[var(--primary)] hover:underline">Autogenerar</button>
            </label>
            <input type="text" id="slug" value={formData.slug || ''} onChange={handleChange} className="form-input" required placeholder="ej-como-viajar-a-egipto" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label htmlFor="author" className="form-label">Autor *</label>
            <input type="text" id="author" value={formData.author || ''} onChange={handleChange} className="form-input" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="category" className="form-label">Categoría *</label>
            <input type="text" id="category" value={formData.category || ''} onChange={handleChange} className="form-input" required placeholder="Ej: Guías, Tips..." />
          </div>
          <div className="space-y-1">
            <label htmlFor="readTime" className="form-label">Tiempo de Lectura (min)</label>
            <input type="number" id="readTime" value={formData.readTime || ''} onChange={handleChange} className="form-input" min="1" />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="summary" className="form-label">Resumen / Extracto *</label>
          <textarea id="summary" value={formData.summary || ''} onChange={handleChange} className="form-input" rows="2" required placeholder="Breve texto introductorio..."></textarea>
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImage" className="form-label">Imagen de Portada (URL)</label>
          <input type="url" id="coverImage" value={formData.coverImage || ''} onChange={handleChange} className="form-input" placeholder="https://ejemplo.com/imagen.jpg" />
        </div>

        <div className="space-y-1">
          <label className="form-label">Etiquetas (Tags)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(formData.tags || []).map((tag, idx) => (
              <span key={idx} className="chip chip-primary">
                {tag}
                <button type="button" onClick={() => removeTag(idx)} className="ml-1 text-[12px] opacity-70 hover:opacity-100 bg-transparent border-none cursor-pointer">✕</button>
              </span>
            ))}
          </div>
          <input type="text" placeholder="Escribe y presiona Enter..." onKeyDown={handleTagsChange} className="form-input" />
        </div>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <h3 className="font-headline-sm text-[var(--on-surface)] border-b border-[var(--outline-variant)] pb-3">Contenido del Artículo</h3>
        
        <div className="space-y-1">
          <label htmlFor="content" className="form-label">Contenido (Admite Markdown / HTML)</label>
          <textarea id="content" value={formData.content || ''} onChange={handleChange} className="form-input font-mono text-sm" rows="15" placeholder="Escribe aquí el contenido de tu post..."></textarea>
        </div>
      </div>
      
      <div className="glass-panel p-4 flex items-center gap-3">
         <input type="checkbox" id="isDraft" checked={formData.isDraft || false} onChange={handleChange} className="w-5 h-5 rounded border-[var(--outline-variant)] text-[var(--primary)] focus:ring-[var(--primary)]" />
         <label htmlFor="isDraft" className="font-semibold text-[var(--on-surface)] cursor-pointer">
           Guardar como Borrador (No visible públicamente)
         </label>
      </div>
    </form>
  );
}

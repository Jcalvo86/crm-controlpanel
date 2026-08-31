import React, { useState, useMemo } from 'react';

export default function MediaLibraryModal({ isOpen, onClose, onSelect, images = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Remove duplicates based on URL
  const uniqueImages = useMemo(() => {
    const imgSet = new Set();
    const result = [];
    for (const url of images) {
      if (url && typeof url === 'string' && url.startsWith('http')) {
        if (!imgSet.has(url)) {
          imgSet.add(url);
          result.push(url);
        }
      }
    }
    return result;
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) return uniqueImages;
    return uniqueImages.filter(url => url.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [uniqueImages, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[var(--surface)] w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[var(--outline-variant)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--outline-variant)] flex justify-between items-center bg-[var(--surface-container-lowest)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--primary)] text-3xl">photo_library</span>
            <div>
              <h2 className="font-headline-sm text-[var(--on-surface)]">Galería de Medios</h2>
              <p className="font-body-sm text-[var(--on-surface-variant)]">Selecciona una imagen ya existente en la plataforma</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)] shrink-0">
          <div className="relative max-w-md mx-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]">search</span>
            <input
              type="text"
              placeholder="Buscar por nombre de archivo o URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all font-body-md"
            />
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-container-lowest)]">
          {filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <span className="material-symbols-outlined text-6xl mb-4 text-[var(--on-surface-variant)]">imagesmode</span>
              <p className="font-headline-sm">No se encontraron imágenes</p>
              <p className="font-body-md mt-2 max-w-sm mx-auto">Intenta subir una nueva imagen o cambia los términos de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((url, idx) => (
                <div 
                  key={idx} 
                  className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--outline-variant)] cursor-pointer hover:border-[var(--primary)] hover:shadow-lg transition-all"
                  onClick={() => {
                    onSelect(url);
                    onClose();
                  }}
                >
                  <img 
                    src={url} 
                    alt="Miniatura" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                    <span className="text-white font-label-md font-bold text-center drop-shadow-md">
                      Seleccionar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

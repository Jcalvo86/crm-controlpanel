import React, { useState, useRef, useEffect } from 'react';
import { uploadFileWithProgress } from '../utils/upload.js';

export default function ImageUploader({ value, onChange, label = 'Imagen', allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], maxSizeBytes = 10 * 1024 * 1024 }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(value ? 'success' : 'idle'); // idle, uploading, error, success
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ speed: '0 MB/s', timeRemaining: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const startTimeRef = useRef(null);

  // Derive status if value is present or changes
  useEffect(() => {
    if (value) {
      setUploadStatus('success');
    } else {
      setUploadStatus('idle');
    }
  }, [value]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = (file) => {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setErrorMessage(`Tipo de archivo no permitido. Tipos válidos: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
      return;
    }

    // Validate size
    if (file.size > maxSizeBytes) {
      setUploadStatus('error');
      setErrorMessage(`El archivo es demasiado grande. El límite es ${(maxSizeBytes / (1024 * 1024))}MB.`);
      return;
    }

    setCurrentFile(file);
    startUpload(file);
  };

  const startUpload = (file) => {
    setUploadStatus('uploading');
    setProgress(0);
    setErrorMessage('');
    setUploadStats({ speed: '0 KB/s', timeRemaining: 'calculando...' });
    startTimeRef.current = Date.now();

    uploadFileWithProgress(file, ({ loaded, total }) => {
      const pct = Math.round((loaded / total) * 100);
      setProgress(pct);

      // Stats calculation
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      if (elapsedSeconds > 0) {
        const bytesPerSecond = loaded / elapsedSeconds;
        
        // Speed string
        let speedStr = '';
        if (bytesPerSecond > 1024 * 1024) {
          speedStr = `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
        } else {
          speedStr = `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
        }

        // ETA calculation
        const remainingBytes = total - loaded;
        let timeRemainingStr = '';
        if (pct === 100) {
          timeRemainingStr = 'Completado';
        } else if (bytesPerSecond > 0) {
          const remainingSeconds = Math.ceil(remainingBytes / bytesPerSecond);
          timeRemainingStr = `${remainingSeconds}s restantes`;
        } else {
          timeRemainingStr = 'calculando...';
        }

        setUploadStats({ speed: speedStr, timeRemaining: timeRemainingStr });
      }
    })
      .then((url) => {
        setUploadStatus('success');
        onChange(url);
      })
      .catch((err) => {
        setUploadStatus('error');
        setErrorMessage(err.message || 'Error al subir el archivo');
      });
  };

  const handleRetry = () => {
    if (currentFile) {
      startUpload(currentFile);
    }
  };

  const handleDelete = () => {
    onChange('');
    setUploadStatus('idle');
    setCurrentFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Extract filename or type from URL if file info is lost
  const getFileDisplayInfo = () => {
    if (currentFile) {
      return {
        name: currentFile.name,
        size: formatBytes(currentFile.size),
        type: currentFile.type.split('/')[1].toUpperCase()
      };
    }
    if (value) {
      try {
        const decodedUrl = decodeURIComponent(value);
        const namePart = decodedUrl.split('/').pop().split('?')[0];
        const ext = namePart.split('.').pop().toUpperCase();
        return {
          name: namePart.length > 30 ? namePart.substring(0, 27) + '...' + ext : namePart,
          size: 'Remoto',
          type: ext || 'IMAGEN'
        };
      } catch (e) {
        return { name: 'Archivo cargado', size: 'Remoto', type: 'IMAGEN' };
      }
    }
    return { name: '', size: '', type: '' };
  };

  const info = getFileDisplayInfo();

  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <span className="font-label-md block" style={{ color: 'var(--on-surface-variant)' }}>
          {label}
        </span>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="hidden"
      />

      {/* Upload States Wrapper */}
      <div className="w-full">
        {/* 1. Idle or dragging state */}
        {(uploadStatus === 'idle' || isDragOver) && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelectFile}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none min-h-[170px]
              ${isDragOver 
                ? 'border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_5%,transparent)] scale-[1.01]' 
                : 'border-[var(--outline)] hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_3%,transparent)]'
              }`}
          >
            <div className={`p-3 rounded-full flex items-center justify-center transition-colors duration-200
              ${isDragOver ? 'bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)]' : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'}`}>
              <span className="material-symbols-outlined text-3xl">
                {isDragOver ? 'cloud_done' : 'cloud_upload'}
              </span>
            </div>
            <div className="text-center">
              <p className="font-body-md font-semibold text-[var(--on-surface)]">
                {isDragOver ? '¡Suelta para cargar la imagen!' : 'Arrastra tu archivo aquí o haz clic para buscar'}
              </p>
              <p className="font-body-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                Formatos permitidos: {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} (máx. {formatBytes(maxSizeBytes)})
              </p>
            </div>
          </div>
        )}

        {/* 2. Uploading State */}
        {uploadStatus === 'uploading' && (
          <div className="border border-[var(--outline-variant)] rounded-xl p-5 bg-[var(--surface-container-low)] space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="material-symbols-outlined text-[var(--primary)] text-2xl shrink-0 animate-pulse">
                  upload_file
                </span>
                <div className="overflow-hidden">
                  <p className="font-body-sm font-semibold truncate text-[var(--on-surface)]" title={info.name}>
                    {info.name}
                  </p>
                  <p className="font-body-xs text-[var(--on-surface-variant)]">
                    {info.size} • {progress}% completado
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end">
                <span className="font-body-sm font-bold text-[var(--primary)]">{uploadStats.speed}</span>
                <span className="font-body-xs text-[var(--on-surface-variant)]">{uploadStats.timeRemaining}</span>
              </div>
            </div>

            {/* Slider/ProgressBar */}
            <div className="w-full flex items-center gap-3">
              <div className="relative w-full h-2 bg-[var(--outline-variant)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-body-xs font-semibold w-8 text-right text-[var(--on-surface)]">{progress}%</span>
            </div>
          </div>
        )}

        {/* 3. Error State */}
        {uploadStatus === 'error' && (
          <div className="border-2 border-dashed border-[var(--outline)] rounded-xl p-5 flex flex-col items-center justify-center gap-4 min-h-[170px]">
            <div className="w-full bg-[color-mix(in_srgb,var(--error)_10%,transparent)] border border-[color-mix(in_srgb,var(--error)_20%,transparent)] rounded-lg p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[var(--error)] shrink-0 mt-0.5">
                error
              </span>
              <div className="flex-1 overflow-hidden">
                <p className="font-body-sm font-semibold text-[var(--error)]">Error al cargar el archivo</p>
                <p className="font-body-xs text-[var(--on-surface-variant)] mt-1 break-words">
                  {errorMessage}
                </p>
              </div>
              {currentFile && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="btn-secondary text-xs shrink-0 flex items-center gap-1 py-1 px-3 border border-[var(--outline)] rounded-md font-semibold hover:bg-[var(--surface-container-high)]"
                  style={{ height: 'auto' }}
                >
                  <span className="material-symbols-outlined text-sm">replay</span>
                  Reintentar
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-[var(--primary)] hover:underline font-semibold"
            >
              Volver a intentar con otro archivo
            </button>
          </div>
        )}

        {/* 4. Success State (Preview) */}
        {uploadStatus === 'success' && value && (
          <div className="border border-[var(--outline-variant)] rounded-xl p-4 bg-[var(--surface-container-low)] flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Thumbnail Preview */}
            <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-[var(--outline-variant)] bg-[var(--surface-container)] flex items-center justify-center">
              <img
                src={value}
                alt="Miniatura de carga"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60';
                }}
              />
            </div>

            {/* Info and Actions */}
            <div className="flex-1 w-full min-w-0 flex flex-col justify-between self-stretch py-1">
              <div className="min-w-0">
                <p className="font-body-md font-bold truncate text-[var(--on-surface)]" title={info.name}>
                  {info.name}
                </p>
                <p className="font-body-xs text-[var(--on-surface-variant)] mt-0.5">
                  Tipo: <span className="font-semibold text-[var(--on-surface)]">{info.type}</span> • Tamaño: <span className="font-semibold text-[var(--on-surface)]">{info.size}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-4 sm:mt-0 pt-2 border-t border-[var(--outline-variant)] sm:border-none">
                <button
                  type="button"
                  onClick={triggerSelectFile}
                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-semibold border-none bg-transparent cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">cached</span>
                  Reemplazar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs text-[var(--error)] hover:underline flex items-center gap-1 font-semibold border-none bg-transparent cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

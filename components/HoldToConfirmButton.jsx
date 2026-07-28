import { useState, useRef } from 'react';

/**
 * A button that requires the user to hold it down for a duration before triggering onConfirm.
 * Shows a progress bar while holding. Used for destructive actions like delete.
 */
export default function HoldToConfirmButton({ onConfirm, children, className, style, title, duration = 2000 }) {
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

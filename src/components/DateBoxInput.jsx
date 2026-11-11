import { useEffect, useRef, useState } from 'react';

/**
 * Boxed Date Input component formatted as MM-DD-YYYY.
 * Provides separate styled boxes for MM, DD, and YYYY terms with
 * automatic focus advance, digit-only filtering, paste support,
 * and a synchronized calendar picker icon.
 */
export function DateBoxInput({ label, value, onChange }) {
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');

  const mmRef = useRef(null);
  const ddRef = useRef(null);
  const yyyyRef = useRef(null);
  const hiddenPickerRef = useRef(null);

  // Sync internal boxed inputs with incoming ISO value (e.g. from presets Q1-Q4)
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      setMm(m);
      setDd(d);
      setYyyy(y);
    } else if (!value) {
      setMm('');
      setDd('');
      setYyyy('');
    }
  }, [value]);

  const notify = (m, d, y) => {
    if (m && d && y && y.length === 4) {
      const paddedM = m.padStart(2, '0');
      const paddedD = d.padStart(2, '0');
      const iso = `${y}-${paddedM}-${paddedD}`;
      const dt = new Date(`${iso}T00:00:00`);
      if (!isNaN(dt.getTime())) {
        onChange(iso);
        return;
      }
    }
    onChange('');
  };

  const handleMmChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMm(val);
    notify(val, dd, yyyy);
    if (val.length === 2 && ddRef.current) {
      ddRef.current.focus();
      ddRef.current.select();
    }
  };

  const handleMmBlur = () => {
    if (mm && mm.length === 1) {
      const padded = mm.padStart(2, '0');
      setMm(padded);
      notify(padded, dd, yyyy);
    }
  };

  const handleDdChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDd(val);
    notify(mm, val, yyyy);
    if (val.length === 2 && yyyyRef.current) {
      yyyyRef.current.focus();
      yyyyRef.current.select();
    }
  };

  const handleDdBlur = () => {
    if (dd && dd.length === 1) {
      const padded = dd.padStart(2, '0');
      setDd(padded);
      notify(mm, padded, yyyy);
    }
  };

  const handleDdKeyDown = (e) => {
    if (e.key === 'Backspace' && !dd && mmRef.current) {
      mmRef.current.focus();
    }
  };

  const handleYyyyChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYyyy(val);
    notify(mm, dd, val);
  };

  const handleYyyyKeyDown = (e) => {
    if (e.key === 'Backspace' && !yyyy && ddRef.current) {
      ddRef.current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim();
    // Support MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY or YYYY-MM-DD
    const m1 = text.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    const m2 = text.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (m1) {
      const m = m1[1].padStart(2, '0');
      const d = m1[2].padStart(2, '0');
      const y = m1[3];
      setMm(m);
      setDd(d);
      setYyyy(y);
      notify(m, d, y);
    } else if (m2) {
      const y = m2[1];
      const m = m2[2].padStart(2, '0');
      const d = m2[3].padStart(2, '0');
      setMm(m);
      setDd(d);
      setYyyy(y);
      notify(m, d, y);
    }
  };

  const openCalendar = () => {
    if (hiddenPickerRef.current) {
      if (typeof hiddenPickerRef.current.showPicker === 'function') {
        hiddenPickerRef.current.showPicker();
      } else {
        hiddenPickerRef.current.click();
      }
    }
  };

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
          MM-DD-YYYY
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* MM Box */}
        <div className="flex flex-col items-center">
          <input
            ref={mmRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="MM"
            value={mm}
            onChange={handleMmChange}
            onBlur={handleMmBlur}
            onPaste={handlePaste}
            className="w-12 h-10 rounded-xl border border-slate-300 bg-white text-center text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
          />
          <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">MM</span>
        </div>

        <span className="text-slate-400 font-bold text-sm mb-3">/</span>

        {/* DD Box */}
        <div className="flex flex-col items-center">
          <input
            ref={ddRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="DD"
            value={dd}
            onChange={handleDdChange}
            onBlur={handleDdBlur}
            onKeyDown={handleDdKeyDown}
            onPaste={handlePaste}
            className="w-12 h-10 rounded-xl border border-slate-300 bg-white text-center text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
          />
          <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">DD</span>
        </div>

        <span className="text-slate-400 font-bold text-sm mb-3">/</span>

        {/* YYYY Box */}
        <div className="flex flex-col items-center">
          <input
            ref={yyyyRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="YYYY"
            value={yyyy}
            onChange={handleYyyyChange}
            onKeyDown={handleYyyyKeyDown}
            onPaste={handlePaste}
            className="w-20 h-10 rounded-xl border border-slate-300 bg-white text-center text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
          />
          <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">YYYY</span>
        </div>

        {/* Calendar Picker Button */}
        <div className="mb-3.5 ml-1">
          <button
            type="button"
            onClick={openCalendar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition shadow-xs cursor-pointer active:scale-95"
            title="Open calendar picker"
            aria-label={`Open calendar picker for ${label}`}
          >
            <span className="text-base">📅</span>
          </button>
          <input
            ref={hiddenPickerRef}
            type="date"
            value={value || ''}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-');
                setMm(m);
                setDd(d);
                setYyyy(y);
                onChange(e.target.value);
              }
            }}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

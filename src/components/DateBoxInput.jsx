import { useEffect, useRef, useState } from 'react';

/**
 * Compact, unified MM-DD-YYYY date input capsule.
 * Features inline segmented slots for MM, DD, and YYYY with auto-advance,
 * digit-only filtering, paste handling, and an integrated calendar trigger.
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
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-[10px] font-semibold text-blue-600">MM/DD/YYYY</span>
      </div>

      <div className="flex h-9 w-full max-w-[240px] items-center rounded-xl border border-slate-300 bg-white px-2.5 shadow-xs transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-400">
        {/* MM */}
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
          className="w-7 bg-transparent text-center text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none"
        />

        <span className="select-none text-xs font-bold text-slate-300 px-0.5">/</span>

        {/* DD */}
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
          className="w-7 bg-transparent text-center text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none"
        />

        <span className="select-none text-xs font-bold text-slate-300 px-0.5">/</span>

        {/* YYYY */}
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
          className="w-11 bg-transparent text-center text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none"
        />

        {/* Integrated Calendar Trigger */}
        <div className="ml-auto flex items-center pl-1.5 border-l border-slate-200">
          <button
            type="button"
            onClick={openCalendar}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer active:scale-95"
            title="Open calendar picker"
            aria-label={`Open calendar picker for ${label}`}
          >
            <span className="text-xs">📅</span>
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

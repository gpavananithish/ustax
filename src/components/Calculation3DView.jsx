import { useMemo, useState } from 'react';

export function Calculation3DView({ result, fmt, rule, decimals = 3 }) {
  const [tiltAngle, setTiltAngle] = useState(15); // Default 15 degrees slant as requested
  const [viewMode, setViewMode] = useState('deduction'); // 'deduction' | 'balance' | 'overview'
  const [hoveredId, setHoveredId] = useState(null);

  const items = useMemo(() => {
    if (viewMode === 'deduction') {
      const totalEligible = result.federal + result.stateAdditional;
      return [
        {
          id: 'federal',
          label: 'Federal Deductible',
          subtitle: 'Schedule A Line 8a',
          value: result.federal,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-blue-600 to-blue-400',
            top: '#93c5fd',
            side: '#1d4ed8',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
          },
          tag: result.interest > 0
            ? (result.isFedLimited ? `${result.federalRatio.toFixed(decimals)} (${result.federalPercent}%)` : '100% eligible')
            : '100% eligible',
        },
        {
          id: 'state',
          label: 'Additional State',
          subtitle: 'State Return Benefit',
          value: result.stateAdditional,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
            top: '#6ee7b7',
            side: '#047857',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
          },
          tag: result.interest > 0
            ? (result.stateRatio < 1 ? `${result.stateRatio.toFixed(decimals)} (${result.statePercent}%) state limit` : 'State adjustment')
            : 'State adjustment',
        },
        {
          id: 'total-eligible',
          label: 'Total Deductible',
          subtitle: 'Combined Fed + State',
          value: totalEligible,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-indigo-600 to-indigo-400',
            top: '#a5b4fc',
            side: '#4338ca',
            badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            dot: 'bg-indigo-500',
          },
          tag: result.interest > 0
            ? `${(((result.federal + result.stateAdditional) / result.interest) * 100).toFixed(1)}% total`
            : 'Total qualifying',
        },
        {
          id: 'reported',
          label: 'Total 1098 Interest',
          subtitle: 'Form 1098 Box 1',
          value: result.interest,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-slate-600 to-slate-400',
            top: '#cbd5e1',
            side: '#334155',
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            dot: 'bg-slate-500',
          },
          tag: '100% reported',
        },
      ];
    } else if (viewMode === 'balance') {
      const maxLimit = Math.max(result.outstanding, result.stateLimit || result.stateCap);
      return [
        {
          id: 'outstanding',
          label: 'Net Mortgage Debt',
          subtitle: 'Average loan balance',
          value: result.outstanding,
          totalRef: maxLimit,
          theme: {
            front: 'bg-gradient-to-t from-blue-600 to-blue-400',
            top: '#93c5fd',
            side: '#1d4ed8',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
          },
          tag: result.outstanding > result.federalLimit ? 'Exceeds Federal Limit' : 'Within Federal Limit',
        },
        {
          id: 'fed-limit',
          label: 'Federal Limit',
          subtitle: rule === 'pre' ? 'Pre-2017 $1.0M limit' : 'Post-2017 $750K limit',
          value: result.federalLimit,
          totalRef: maxLimit,
          theme: {
            front: 'bg-gradient-to-t from-amber-600 to-amber-400',
            top: '#fcd34d',
            side: '#b45309',
            badge: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500',
          },
          tag: `${fmt(result.federalLimit)} statutory limit`,
        },
        {
          id: 'state-limit',
          label: 'State Limit',
          subtitle: 'State debt threshold',
          value: result.stateLimit || result.stateCap,
          totalRef: maxLimit,
          theme: {
            front: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
            top: '#6ee7b7',
            side: '#047857',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
          },
          tag: `${fmt(result.stateLimit || result.stateCap)} state limit`,
        },
      ];
    } else {
      return [
        {
          id: 'outstanding',
          label: 'Net Outstanding',
          subtitle: 'Average total debt',
          value: result.outstanding,
          totalRef: result.outstanding,
          theme: {
            front: 'bg-gradient-to-t from-blue-600 to-blue-400',
            top: '#93c5fd',
            side: '#1d4ed8',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
          },
          tag: 'Principal balance',
        },
        {
          id: 'federal',
          label: 'Federal Deductible',
          subtitle: 'Eligible interest deduction',
          value: result.federal,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-indigo-600 to-indigo-400',
            top: '#a5b4fc',
            side: '#4338ca',
            badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            dot: 'bg-indigo-500',
          },
          tag: result.isFedLimited ? `${result.federalRatio.toFixed(decimals)} (${result.federalPercent}%)` : '100% eligible',
        },
        {
          id: 'state-add',
          label: 'Additional State',
          subtitle: 'Extra state deduction',
          value: result.stateAdditional,
          totalRef: result.interest,
          theme: {
            front: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
            top: '#6ee7b7',
            side: '#047857',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
          },
          tag: result.stateAdditional > 0 ? 'State benefit' : 'None',
        },
      ];
    }
  }, [viewMode, result, rule, decimals, fmt]);

  const maxVal = Math.max(...items.map((it) => it.value), 1);
  const maxHeight = 160;
  const minHeight = 36;
  const stageTilt = tiltAngle;
  const stageRotateY = -Math.round(tiltAngle * 0.7);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      {/* Header with Title and Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex h-6 items-center rounded-md bg-blue-100 px-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              3D Calculation View
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Slanted at {tiltAngle}°
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Ratio: {result.isFedLimited ? `${result.federalRatio.toFixed(decimals)} (${result.federalPercent}%)` : '100%'}
            </span>
          </div>
          <h3 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">Visual Deduction Split</h3>
          <p className="text-xs text-slate-500">Real-time 3D visual comparison of qualifying mortgage interest and debt limits.</p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setViewMode('deduction')}
            className={`flex-1 sm:flex-none text-center rounded-lg px-2.5 sm:px-3 py-1.5 transition ${viewMode === 'deduction' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Deduction Split
          </button>
          <button
            onClick={() => setViewMode('balance')}
            className={`flex-1 sm:flex-none text-center rounded-lg px-2.5 sm:px-3 py-1.5 transition ${viewMode === 'balance' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Balance vs Limit
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 sm:flex-none text-center rounded-lg px-2.5 sm:px-3 py-1.5 transition ${viewMode === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Overview
          </button>
        </div>
      </div>

      {/* Controls Bar: Presets & Tilt Slider */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:px-4 sm:py-2.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-slate-700 w-full xs:w-auto mr-1 sm:mr-0">Slant:</span>
          <button
            onClick={() => setTiltAngle(15)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 15 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            15° (Default)
          </button>
          <button
            onClick={() => setTiltAngle(0)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 0 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            0° Flat
          </button>
          <button
            onClick={() => setTiltAngle(25)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 25 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            25° Isometric
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
          <label htmlFor="tilt-slider" className="font-semibold text-slate-700">
            Slant: <span className="font-bold text-blue-600">{tiltAngle}°</span>
          </label>
          <input
            id="tilt-slider"
            type="range"
            min="0"
            max="30"
            step="1"
            value={tiltAngle}
            onChange={(e) => setTiltAngle(Number(e.target.value))}
            className="h-1.5 w-24 sm:w-28 cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* 3D Stage Canvas */}
      <div className="stage-3d-viewport relative mt-6 flex min-h-[290px] sm:min-h-[320px] w-full items-end justify-center overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-slate-100/70 to-blue-50/60 p-3 sm:p-6 pb-10 sm:pb-12 pt-14 sm:pt-16">
        {/* Ambient perspective floor grid */}
        <div
          className="floor-grid-pattern pointer-events-none absolute inset-x-8 bottom-4 h-36 rounded-2xl opacity-60"
          style={{
            transform: `perspective(800px) rotateX(${Math.max(45, tiltAngle + 35)}deg) scale(1.15)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* 3D Floor Platform */}
        <div
          className="stage-3d-floor relative z-10 flex items-end justify-center gap-3 xs:gap-6 sm:gap-10 md:gap-14 lg:gap-16"
          style={{
            transform: `rotateX(${stageTilt}deg) rotateY(${stageRotateY}deg)`,
          }}
        >
          {items.map((item) => {
            const h = item.value > 0 ? Math.max(minHeight, Math.round((item.value / maxVal) * maxHeight)) : minHeight;
            const isHovered = hoveredId === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="pillar-3d-group relative flex flex-col items-center cursor-pointer group w-14 sm:w-16 md:w-[76px]"
                style={{
                  height: h + 40,
                }}
              >
                {/* Floating Billboarded Value Badge */}
                <div
                  className={`pointer-events-none absolute left-1/2 whitespace-nowrap rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-center font-bold shadow-lg transition-all duration-300 ${
                    isHovered
                      ? 'bg-slate-900 text-white scale-110 shadow-xl ring-2 ring-blue-400'
                      : 'bg-white/95 text-slate-900 shadow-md border border-slate-200'
                  }`}
                  style={{
                    top: -12,
                    transform: `translateX(-50%) translateZ(28px) rotateX(-${stageTilt}deg) rotateY(${-stageRotateY}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <span className="block text-[11px] sm:text-xs">{fmt(item.value)}</span>
                  <span className="block text-[8px] sm:text-[9px] font-medium opacity-80">{item.tag}</span>
                </div>

                {/* 3D Pillar Body */}
                <div
                  className="relative w-full transition-all duration-500 ease-out"
                  style={{ height: h, marginTop: 'auto' }}
                >
                  {/* Floor Shadow */}
                  <div className="pillar-floor-shadow" />

                  {/* Front Face */}
                  <div
                    className={`pillar-face-front ${item.theme.front} transition-all duration-300 ${
                      isHovered ? 'brightness-110 ring-2 ring-white/50' : ''
                    }`}
                    style={{ height: h }}
                  />

                  {/* Top Face */}
                  <div
                    className="pillar-face-top transition-all duration-300"
                    style={{
                      backgroundColor: item.theme.top,
                      filter: isHovered ? 'brightness(1.15)' : 'brightness(1.0)',
                    }}
                  />

                  {/* Right Side Face */}
                  <div
                    className="pillar-face-side transition-all duration-300"
                    style={{
                      height: h,
                      backgroundColor: item.theme.side,
                      filter: isHovered ? 'brightness(1.1)' : 'brightness(0.85)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upright Metric Detail Cards Below 3D Stage */}
      <div className={`mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {items.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'border-blue-500 bg-blue-50/40 shadow-md ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.theme.dot}`} />
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.theme.badge}`}>
                  {item.tag}
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words">{fmt(item.value)}</div>
                <div className="mt-0.5 text-xs text-slate-500">{item.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculation Summary Footer */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:px-4 sm:py-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Federal Deduction Ratio:</span>
          <span className="font-bold text-blue-700">
            {result.isFedLimited ? `${result.federalRatio.toFixed(decimals)} (${result.federalPercent}%)` : '100%'}
          </span>
          <span className="text-slate-400 hidden xs:inline">·</span>
          <span>
            Applicable Limit: <b className="text-slate-800">{fmt(result.federalLimit)}</b> ({rule === 'pre' ? 'Pre-2017' : 'Post-2017'})
          </span>
        </div>
        <div className="text-slate-500">
          State Deductible: <b className="text-emerald-700">{fmt(result.stateTotal)}</b> (State limit: {fmt(result.stateLimit || result.stateCap)})
        </div>
      </div>
    </section>
  );
}

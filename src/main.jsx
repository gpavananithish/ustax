import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const number = (value) => Math.max(0, Number(String(value).replace(/,/g, '')) || 0);
const fmt = (value) => money.format(value);

function Field({ label, value, onChange, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Calculation3DView({ result, fmt, rule, decimals = 3 }) {
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
          tag: result.interest > 0 ? `${result.federalPercent.toFixed(decimals)}% of interest` : '100% eligible',
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
          tag: result.interest > 0 ? `${result.statePercent.toFixed(decimals)}% state limit` : 'State adjustment',
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
          tag: result.interest > 0 ? `${(((result.federal + result.stateAdditional) / result.interest) * 100).toFixed(decimals)}% total` : 'Total qualifying',
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
      const maxCap = Math.max(result.outstanding, result.stateCap);
      return [
        {
          id: 'outstanding',
          label: 'Net Mortgage Debt',
          subtitle: 'Average loan balance',
          value: result.outstanding,
          totalRef: maxCap,
          theme: {
            front: 'bg-gradient-to-t from-blue-600 to-blue-400',
            top: '#93c5fd',
            side: '#1d4ed8',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
          },
          tag: result.outstanding > result.federalLimit ? 'Exceeds Federal Cap' : 'Within Federal Cap',
        },
        {
          id: 'fed-limit',
          label: 'Federal Limit',
          subtitle: rule === 'pre' ? 'Pre-2017 $1.0M cap' : 'Post-2017 $750K cap',
          value: result.federalLimit,
          totalRef: maxCap,
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
          id: 'state-cap',
          label: 'State Limit',
          subtitle: 'State debt threshold',
          value: result.stateCap,
          totalRef: maxCap,
          theme: {
            front: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
            top: '#6ee7b7',
            side: '#047857',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
          },
          tag: `${fmt(result.stateCap)} state cap`,
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
          tag: `${result.federalPercent.toFixed(decimals)}% of interest`,
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
  }, [viewMode, result, rule, decimals]);

  const maxVal = Math.max(...items.map((it) => it.value), 1);
  const maxHeight = 160;
  const minHeight = 36;
  const stageTilt = tiltAngle;
  const stageRotateY = -Math.round(tiltAngle * 0.7);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header with Title and Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-md bg-blue-100 px-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              3D Calculation View
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Slanted at {tiltAngle}°
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Ratio: {result.federalPercent.toFixed(decimals)}%
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Visual Deduction Split</h3>
          <p className="text-xs text-slate-500">Real-time 3D visual comparison of qualifying mortgage interest and debt caps.</p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('deduction')}
            className={`rounded-lg px-3 py-1.5 transition ${viewMode === 'deduction' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Interest Deduction Split
          </button>
          <button
            onClick={() => setViewMode('balance')}
            className={`rounded-lg px-3 py-1.5 transition ${viewMode === 'balance' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Loan Balance vs Limit
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className={`rounded-lg px-3 py-1.5 transition ${viewMode === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Overview (3 Metrics)
          </button>
        </div>
      </div>

      {/* Controls Bar: Presets & Tilt Slider */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Slant Presets:</span>
          <button
            onClick={() => setTiltAngle(15)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 15 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            15° Slant (Default)
          </button>
          <button
            onClick={() => setTiltAngle(0)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 0 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            0° Flat View
          </button>
          <button
            onClick={() => setTiltAngle(25)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${tiltAngle === 25 ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            25° Isometric
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="tilt-slider" className="font-semibold text-slate-700">
            Slant Angle: <span className="font-bold text-blue-600">{tiltAngle}°</span>
          </label>
          <input
            id="tilt-slider"
            type="range"
            min="0"
            max="30"
            step="1"
            value={tiltAngle}
            onChange={(e) => setTiltAngle(Number(e.target.value))}
            className="h-1.5 w-28 cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* 3D Stage Canvas */}
      <div className="stage-3d-viewport relative mt-6 flex min-h-[300px] w-full items-end justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-slate-100/70 to-blue-50/60 p-6 pb-12 pt-16">
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
          className="stage-3d-floor relative z-10 flex items-end justify-center gap-8 sm:gap-12 md:gap-16"
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
                className="pillar-3d-group relative flex flex-col items-center cursor-pointer group"
                style={{
                  width: 76,
                  height: h + 40,
                }}
              >
                {/* Floating Billboarded Value Badge */}
                <div
                  className={`pointer-events-none absolute left-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-center text-xs font-bold shadow-lg transition-all duration-300 ${
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
                  <span className="block">{fmt(item.value)}</span>
                  <span className="block text-[9px] font-medium opacity-80">{item.tag}</span>
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

                  {/* Top Face (Cap) */}
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
      <div className={`mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {items.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'border-blue-500 bg-blue-50/40 shadow-md ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${item.theme.dot}`} />
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.theme.badge}`}>
                  {item.tag}
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{fmt(item.value)}</div>
                <div className="mt-0.5 text-xs text-slate-500">{item.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculation Summary Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Federal Deduction Ratio:</span>
          <span className="font-bold text-blue-700">{result.federalPercent.toFixed(decimals)}%</span>
          <span className="text-slate-400">·</span>
          <span>
            Applicable Cap: <b className="text-slate-800">{fmt(result.federalLimit)}</b> ({rule === 'pre' ? 'Pre-2017' : 'Post-2017'})
          </span>
        </div>
        <div className="text-slate-500">
          State Deductible: <b className="text-emerald-700">{fmt(result.stateTotal)}</b> (State cap: {fmt(result.stateCap)})
        </div>
      </div>
    </section>
  );
}

function App() {
  const [rule, setRule] = useState('post');
  const [loanType, setLoanType] = useState('direct');
  const [decimals, setDecimals] = useState(3); // 1, 2, 3, 4, 5 (3 is default)
  const [descStyle, setDescStyle] = useState('simple'); // 'simple' | 'detailed'
  const [loans, setLoans] = useState([{ name: 'Loan 1', start: '', end: '', interest: '' }]);
  const [copied, setCopied] = useState('');

  const requiredCount = loanType === 'direct' ? 1 : 2;
  const displayLoans =
    loans.length < requiredCount
      ? [...loans, ...Array.from({ length: requiredCount - loans.length }, (_, i) => ({ name: `Loan ${loans.length + i + 1}`, start: '', end: '', interest: '' }))]
      : loans;

  const updateLoan = (index, key, value) =>
    setLoans((current) => {
      const next = [...(current.length < requiredCount ? displayLoans : current)];
      next[index] = { ...next[index], [key]: value };
      return next;
    });

  const switchType = (type) => {
    setLoanType(type);
    if (type === 'direct') setLoans((current) => current.slice(0, 1));
    else if (loans.length < 2) setLoans((current) => [...current, { name: 'Loan 2', start: '', end: '', interest: '' }]);
  };

  const result = useMemo(() => {
    const rows = displayLoans.map((loan) => {
      const startAmount = number(loan.start);
      const endAssumed = String(loan.end).trim() === '';
      const endAmount = endAssumed ? startAmount : number(loan.end);
      return { ...loan, startAmount, endAmount, endAssumed, avg: (startAmount + endAmount) / 2, interest: number(loan.interest) };
    });
    const outstanding = rows.reduce((sum, item) => sum + item.avg, 0);
    const interest = rows.reduce((sum, item) => sum + item.interest, 0);
    const federalLimit = rule === 'pre' ? 1000000 : 750000;

    // First calculate the percentage, round to selected decimal places (1, 2, 3, 4, 5), then multiply with total Form 1098 interest
    const rawFederalPercent = outstanding > 0 && outstanding > federalLimit ? (federalLimit / outstanding) * 100 : 100;
    const federalPercent = outstanding > 0 && outstanding > federalLimit ? Number(rawFederalPercent.toFixed(decimals)) : 100;
    const federalRatio = federalPercent / 100;
    const federal = interest * federalRatio;

    const stateCap = 1000000;
    const rawStatePercent = outstanding > 0 && outstanding > stateCap ? (stateCap / outstanding) * 100 : 100;
    const statePercent = outstanding > 0 && outstanding > stateCap ? Number(rawStatePercent.toFixed(decimals)) : 100;
    const stateRatio = statePercent / 100;
    const stateTotal = interest * stateRatio;
    const stateAdditional = Math.max(0, stateTotal - federal);

    return {
      rows,
      outstanding,
      interest,
      federalLimit,
      federalPercent,
      federalRatio,
      federal,
      stateCap,
      statePercent,
      stateRatio,
      stateTotal,
      stateAdditional,
      decimals,
    };
  }, [displayLoans, rule, decimals]);

  const lines = useMemo(() => {
    if (descStyle === 'simple') {
      const loanLines = result.rows.flatMap((item) => {
        const avgText =
          item.startAmount === item.endAmount || item.endAssumed
            ? `${item.name} Avg Balance: ${fmt(item.avg)}`
            : `${item.name} Avg Balance: (${fmt(item.startAmount)} + ${fmt(item.endAmount)}) ÷ 2 = ${fmt(item.avg)}`;
        return [avgText, `${item.name} Form 1098 Interest: ${fmt(item.interest)}`];
      });

      const summaryLines = [];
      if (result.rows.length > 1) {
        summaryLines.push(
          `Total Avg Balance: ${fmt(result.outstanding)}`,
          `Total Form 1098 Interest: ${fmt(result.interest)}`
        );
      }

      if (rule === 'pre') {
        const fedLines =
          result.outstanding > 1000000
            ? [
                `Pre-2017 Limit ($1,000,000): ${fmt(1000000)} ÷ ${fmt(result.outstanding)} = ${result.federalPercent.toFixed(decimals)}%`,
                `Eligible Interest (Fed & State): ${fmt(result.interest)} × ${result.federalPercent.toFixed(decimals)}% = ${fmt(result.federal)}`,
              ]
            : [
                `Pre-2017 Limit ($1,000,000): Within limit (100% eligible)`,
                `Eligible Interest (Fed & State): ${fmt(result.federal)}`,
              ];
        return [...loanLines, ...summaryLines, ...fedLines];
      }

      // Post-2017
      const fedLines =
        result.outstanding > result.federalLimit
          ? [
              `Federal Limit ($750,000): ${fmt(result.federalLimit)} ÷ ${fmt(result.outstanding)} = ${result.federalPercent.toFixed(decimals)}%`,
              `Federal Deductible: ${fmt(result.interest)} × ${result.federalPercent.toFixed(decimals)}% = ${fmt(result.federal)}`,
            ]
          : [
              `Federal Limit ($750,000): Within limit (100% eligible)`,
              `Federal Deductible: ${fmt(result.federal)}`,
            ];

      const stateLines = [];
      if (result.stateAdditional > 0) {
        if (result.outstanding > result.stateCap) {
          stateLines.push(
            `State Limit ($1,000,000): ${fmt(result.stateCap)} ÷ ${fmt(result.outstanding)} = ${result.statePercent.toFixed(decimals)}%`,
            `State Deductible: ${fmt(result.interest)} × ${result.statePercent.toFixed(decimals)}% = ${fmt(result.stateTotal)}`
          );
        } else {
          stateLines.push(`State Limit ($1,000,000): Within limit (100% eligible)`);
        }
        stateLines.push(`Additional State Deductible: ${fmt(result.stateTotal)} − ${fmt(result.federal)} = ${fmt(result.stateAdditional)}`);
      } else {
        stateLines.push(`Additional State Deductible: $0.00`);
      }

      return [...loanLines, ...summaryLines, ...fedLines, ...stateLines];
    }

    const loanLines = result.rows.flatMap((item) => [
      item.endAssumed
        ? `${item.name}: ending balance was not provided; using the beginning balance of ${fmt(item.startAmount)} as the ending balance. Average outstanding balance = (${fmt(item.startAmount)} + ${fmt(item.endAmount)}) ÷ 2 = ${fmt(item.avg)}.`
        : `${item.name}: (${fmt(item.startAmount)} beginning balance + ${fmt(item.endAmount)} ending balance) ÷ 2 = ${fmt(item.avg)} average outstanding balance.`,
      `${item.name} mortgage interest reported on Form 1098: ${fmt(item.interest)}.`,
    ]);
    const typeLabel = loanType === 'direct' ? 'Direct loan' : loanType === 'refinance' ? 'Refinance loans' : 'First and second loans';
    const netLine = `${typeLabel} net mortgage outstanding amount = ${result.rows.map((r) => fmt(r.avg)).join(' + ')} = ${fmt(result.outstanding)}.`;
    const totalLine = `Total mortgage interest = ${result.rows.map((r) => fmt(r.interest)).join(' + ')} = ${fmt(result.interest)}.`;

    if (rule === 'pre') {
      return [
        ...loanLines,
        netLine,
        totalLine,
        result.outstanding > 1000000
          ? `Federal/state loan limit: ${fmt(1000000)} ÷ ${fmt(result.outstanding)} = ${result.federalPercent.toFixed(decimals)}%.`
          : `Net mortgage is within the ${fmt(1000000)} pre-2017 loan limit; 100% of interest is eligible.`,
        `Mortgage interest eligible for federal and state deduction = ${fmt(result.interest)} × ${result.federalPercent.toFixed(decimals)}% = ${fmt(result.federal)}.`,
      ];
    }

    const federalExplanation =
      result.outstanding > result.federalLimit
        ? `Federal loan limit: ${fmt(result.federalLimit)} ÷ ${fmt(result.outstanding)} = ${result.federalPercent.toFixed(decimals)}%.`
        : `Net mortgage is within the ${fmt(result.federalLimit)} federal loan limit; 100% of interest is eligible for federal.`;

    const stateExplanation =
      result.outstanding > result.stateCap
        ? `State limit calculation: ${fmt(result.stateCap)} ÷ ${fmt(result.outstanding)} = ${result.statePercent.toFixed(decimals)}%; ${fmt(result.interest)} × ${result.statePercent.toFixed(decimals)}% = ${fmt(result.stateTotal)} total state-eligible interest.`
        : `Net mortgage is within the ${fmt(result.stateCap)} state limit; state-eligible interest is ${fmt(result.interest)}.`;

    return [
      ...loanLines,
      netLine,
      totalLine,
      federalExplanation,
      `Federal mortgage interest eligible for deduction = ${fmt(result.interest)} × ${result.federalPercent.toFixed(decimals)}% = ${fmt(result.federal)}.`,
      stateExplanation,
      `Additional state mortgage interest eligible = ${fmt(result.stateTotal)} − ${fmt(result.federal)} = ${fmt(result.stateAdditional)}.`,
    ];
  }, [result, rule, loanType, decimals, descStyle]);

  const copy = async (line, id) => {
    await navigator.clipboard.writeText(line);
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <main className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="US-Tax Logo" className="h-10 w-10 rounded-xl shadow-sm" />
            <div>
              <h1 className="font-bold text-lg leading-tight">US-Tax</h1>
              <p className="text-xs text-slate-500">Mortgage Limit Studio · 1098 deduction workspace</p>
            </div>
          </div>
          <nav className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium">
            <button className="rounded-lg bg-white px-3 py-2 text-blue-700 shadow-sm">Loan limit calculation</button>
            <button disabled className="cursor-not-allowed rounded-lg px-3 py-2 text-slate-400">
              Loan limit days <span className="text-[10px]">Soon</span>
            </button>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">Mortgage interest worksheet</p>
          <h2 className="text-3xl font-bold tracking-tight">Calculate the limit. Copy the explanation.</h2>
          <p className="mt-2 text-slate-600">
            Enter the balances and Form 1098 interest for each loan. Every calculation line is ready to paste into your tax return description.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.06fr_.94fr]">
          <div className="space-y-5">
            {/* Acquisition Date Rule */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-slate-700">Acquisition date rule</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRule('pre')}
                  className={`rounded-xl border p-3 text-left transition ${
                    rule === 'pre' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <b className="block">Pre-2017</b>
                  <span className="text-xs text-slate-500">Bought on/before Dec. 15, 2017 · $1M limit</span>
                </button>
                <button
                  onClick={() => setRule('post')}
                  className={`rounded-xl border p-3 text-left transition ${
                    rule === 'post' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <b className="block">Post-2017</b>
                  <span className="text-xs text-slate-500">Bought after Dec. 15, 2017 · $750K federal</span>
                </button>
              </div>
            </div>

            {/* Loan Arrangement */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-slate-700">Loan arrangement</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ['direct', 'Direct loan', 'One loan'],
                  ['refinance', 'Refinance', 'Two or more loans'],
                  ['first-second', '1st + 2nd loan', 'Two loans'],
                ].map(([id, title, sub]) => (
                  <button
                    key={id}
                    onClick={() => switchType(id)}
                    className={`rounded-xl border p-3 text-left ${
                      loanType === id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <b className="block text-sm">{title}</b>
                    <span className="text-xs text-slate-500">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Percentage Decimal Places Option */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Percentage decimal places</p>
                  <p className="text-xs text-slate-500">
                    Digits after decimal for limit % before multiplying by Form 1098 interest
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {decimals} decimal{decimals > 1 ? 's' : ''} {decimals === 3 ? '(Default)' : ''}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDecimals(d)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2.5 transition ${
                      decimals === d
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">{d}</span>
                    <span className="text-[10px] text-slate-500">{d === 3 ? 'Default' : `${d} digit${d > 1 ? 's' : ''}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">Loan details</p>
                  <p className="text-xs text-slate-500">Use average balance: (beginning + ending) ÷ 2</p>
                </div>
                {loanType === 'refinance' && (
                  <button
                    onClick={() => setLoans([...displayLoans, { name: `Loan ${displayLoans.length + 1}`, start: '', end: '', interest: '' }])}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    + Add other loan
                  </button>
                )}
              </div>
              <div className="space-y-5">
                {displayLoans.map((loan, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-3 flex justify-between">
                      <b className="text-sm">{loanType === 'first-second' ? (i === 0 ? '1st loan' : '2nd loan') : loan.name}</b>
                      {loanType === 'refinance' && displayLoans.length > 2 && (
                        <button onClick={() => setLoans(displayLoans.filter((_, x) => x !== i))} className="text-xs font-semibold text-rose-600">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Beginning balance" value={loan.start} onChange={(v) => updateLoan(i, 'start', v)} />
                      <Field label="Ending balance" value={loan.end} onChange={(v) => updateLoan(i, 'end', v)} />
                      <Field label="1098 interest" value={loan.interest} onChange={(v) => updateLoan(i, 'interest', v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Eligible Deduction & Return Description */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-300">Eligible deduction</p>
              <div className="mt-4 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-slate-400">Federal</p>
                  <p className="mt-1 text-3xl font-bold">{fmt(result.federal)}</p>
                  <p className="mt-1 text-xs text-slate-400">Limit: {fmt(result.federalLimit)}</p>
                </div>
                <div className="border-l border-slate-700 pl-5">
                  <p className="text-sm text-slate-400">Additional state</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-300">{fmt(result.stateAdditional)}</p>
                  <p className="mt-1 text-xs text-slate-400">State total: {fmt(result.stateTotal)}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-300">
                Net mortgage: <b className="text-white">{fmt(result.outstanding)}</b> · Form 1098 interest:{' '}
                <b className="text-white">{fmt(result.interest)}</b> · Ratio:{' '}
                <b className="text-white">{result.federalPercent.toFixed(decimals)}%</b>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">Return description</p>
                  <p className="text-xs text-slate-500">Copy individual lines into Drake</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDescStyle('simple')}
                      className={`rounded-md px-2.5 py-1 transition ${
                        descStyle === 'simple' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescStyle('detailed')}
                      className={`rounded-md px-2.5 py-1 transition ${
                        descStyle === 'detailed' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                  <button
                    onClick={() => copy(lines.join('\n'), 'all')}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {copied === 'all' ? 'Copied all!' : 'Copy all'}
                  </button>
                </div>
              </div>
              <div className="max-h-[440px] space-y-2 overflow-auto pr-1">
                {lines.map((line, i) => (
                  <div key={i} className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <p className="flex-1 font-mono text-xs sm:text-sm leading-5 text-slate-800">{line}</p>
                    <button
                      onClick={() => copy(line, String(i))}
                      aria-label="Copy line"
                      className="h-8 shrink-0 rounded-lg bg-white px-2.5 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50"
                    >
                      {copied === String(i) ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Calculation View (15° Slant + Decimal precision) */}
        <Calculation3DView result={result} fmt={fmt} rule={rule} decimals={decimals} />

        <p className="mt-5 text-xs text-slate-500">
          Calculation aid only. Confirm acquisition debt, refinance tracing, state rules, and the applicable tax-year guidance before filing.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

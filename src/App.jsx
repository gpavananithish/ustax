import { useMemo, useState } from 'react';
import { calculateMortgageLimits } from './utils/calculations.js';
import { Calculation3DView } from './components/Calculation3DView.jsx';
import { LoanLimitDaysView } from './components/LoanLimitDaysView.jsx';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const fmt = (value) => money.format(value);

function Field({ label, value, onChange, hint, presets, warning }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (val && Number(val) < 0) {
            onChange('0');
          } else {
            onChange(val);
          }
        }}
        placeholder="0.00"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
      />
      {presets && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(String(p.val))}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {warning && <span className="mt-1 block text-[11px] font-semibold text-amber-600">{warning}</span>}
      {hint && !warning && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('balance'); // 'balance' | 'days'
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
    return calculateMortgageLimits({
      rule,
      loanType,
      loans: displayLoans,
      decimals,
      descStyle,
    });
  }, [displayLoans, rule, loanType, decimals, descStyle]);

  const lines = result.lines;

  const copy = async (line, id) => {
    await navigator.clipboard.writeText(line);
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <main className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-3.5 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <img src="/favicon.svg" alt="US-Tax Logo" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-sm shrink-0" />
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">US-Tax</h1>
              <p className="text-[11px] sm:text-xs text-slate-500">Mortgage Limit Studio · 1098 deduction workspace</p>
            </div>
          </div>
          <nav className="flex w-full sm:w-auto gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('balance')}
              className={`flex-1 sm:flex-none text-center rounded-lg px-3 py-2 transition ${
                activeTab === 'balance'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loan limit calculation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('days')}
              className={`flex-1 sm:flex-none text-center rounded-lg px-3 py-2 transition ${
                activeTab === 'days'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loan limit days
            </button>
          </nav>
        </div>
      </header>

      {activeTab === 'days' ? (
        <LoanLimitDaysView />
      ) : (
        <section className="mx-auto max-w-7xl px-3.5 sm:px-5 py-5 sm:py-8">
          <div className="mb-6 sm:mb-7 max-w-2xl">
            <p className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600">Mortgage interest worksheet</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Calculate the limit. Copy the explanation.</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Enter the balances and Form 1098 interest for each loan. Every calculation line is ready to paste into your tax return description.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.06fr_.94fr]">
            <div className="space-y-5">
              {/* Acquisition Date Rule */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-slate-700">Acquisition date rule</p>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setRule('pre')}
                    className={`rounded-xl border p-3 text-left transition ${
                      rule === 'pre' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <b className="block text-sm sm:text-base">Pre-2017</b>
                    <span className="text-xs text-slate-500">Bought on/before Dec. 15, 2017 · $1M limit</span>
                  </button>
                  <button
                    onClick={() => setRule('post')}
                    className={`rounded-xl border p-3 text-left transition ${
                      rule === 'post' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <b className="block text-sm sm:text-base">Post-2017</b>
                    <span className="text-xs text-slate-500">Bought after Dec. 15, 2017 · $750K federal</span>
                  </button>
                </div>
              </div>

              {/* Loan Arrangement */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-slate-700">Loan arrangement</p>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                  {[
                    ['direct', 'Direct loan', 'One loan'],
                    ['refinance', 'Refinance', 'Two or more loans'],
                    ['first-second', '1st + 2nd loan', 'Two loans'],
                  ].map(([id, title, sub]) => (
                    <button
                      key={id}
                      onClick={() => switchType(id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        loanType === id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <b className="block text-sm">{title}</b>
                      <span className="text-xs text-slate-500">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Percentage Decimal Places Option */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Ratio decimal places (IRS Pub 936)</p>
                    <p className="text-xs text-slate-500">
                      Digits considered before multiplying by 100 (e.g. 0.694 = 3 digits)
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {decimals} decimal{decimals > 1 ? 's' : ''} {decimals === 3 ? '(Default · IRS)' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDecimals(d)}
                      className={`flex flex-col items-center justify-center rounded-xl border py-2 sm:py-2.5 transition ${
                        decimals === d
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-100 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-bold">{d}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 truncate max-w-full px-0.5">
                        {d === 3 ? 'IRS' : `${d}d`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">Loan details</p>
                    <p className="text-xs text-slate-500">Use average balance: (beginning + ending) ÷ 2</p>
                  </div>
                  {loanType === 'refinance' && (
                    <button
                      onClick={() => setLoans([...displayLoans, { name: `Loan ${displayLoans.length + 1}`, start: '', end: '', interest: '' }])}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      + Add other loan
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {displayLoans.map((loan, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3.5 sm:p-4 border border-slate-100">
                      <div className="mb-3 flex justify-between items-center">
                        <b className="text-sm text-slate-800">{loanType === 'first-second' ? (i === 0 ? '1st loan' : '2nd loan') : loan.name}</b>
                        {loanType === 'refinance' && displayLoans.length > 2 && (
                          <button onClick={() => setLoans(displayLoans.filter((_, x) => x !== i))} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                        <Field
                          label="Beginning balance"
                          value={loan.start}
                          onChange={(v) => updateLoan(i, 'start', v)}
                          presets={[
                            { label: '$500k', val: '500000' },
                            { label: '$750k', val: '750000' },
                            { label: '$1M', val: '1000000' },
                          ]}
                        />
                        <Field
                          label="Ending balance"
                          value={loan.end}
                          onChange={(v) => updateLoan(i, 'end', v)}
                          presets={[
                            { label: 'Same as start', val: loan.start || '0' },
                            { label: '$0 (Paid off)', val: '0' },
                          ]}
                        />
                        <Field
                          label="1098 interest"
                          value={loan.interest}
                          onChange={(v) => updateLoan(i, 'interest', v)}
                          warning={
                            Number(loan.interest) > 0 &&
                            (Number(loan.start) > 0 || Number(loan.end) > 0) &&
                            Number(loan.interest) > (Number(loan.start || 0) + Number(loan.end || 0))
                              ? 'Notice: Interest exceeds principal'
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Eligible Deduction & Return Description */}
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-950 p-5 sm:p-6 text-white shadow-xl">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-300">Eligible deduction</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Federal</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">{fmt(result.federal)}</p>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-400">Limit: {fmt(result.federalLimit)}</p>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
                    <p className="text-xs sm:text-sm text-slate-400">Additional state</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-300 break-words">{fmt(result.stateAdditional)}</p>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-400">State total: {fmt(result.stateTotal)}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-800 pt-4 text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Net mortgage: <b className="text-white">{fmt(result.outstanding)}</b></span>
                  <span className="text-slate-600">·</span>
                  <span>Form 1098 interest: <b className="text-white">{fmt(result.interest)}</b></span>
                  <span className="text-slate-600">·</span>
                  <span>Ratio: <b className="text-white">{result.isFedLimited ? `${result.federalRatio.toFixed(decimals)} (${result.federalPercent}%)` : '100%'}</b></span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <p className="font-bold text-slate-900">Return description</p>
                    <p className="text-xs text-slate-500">Copy individual lines into Drake</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
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
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {copied === 'all' ? 'Copied all!' : 'Copy all'}
                    </button>
                  </div>
                </div>
                <div className="max-h-[440px] space-y-2 overflow-auto pr-1">
                  {lines.map((line, i) => (
                    <div key={i} className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 sm:p-2.5">
                      <p className="flex-1 font-mono text-xs sm:text-sm leading-5 text-slate-800 break-words min-w-0 pr-1">{line}</p>
                      <button
                        onClick={() => copy(line, String(i))}
                        aria-label="Copy line"
                        className="h-8 shrink-0 rounded-lg bg-white px-2.5 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50 transition"
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
      )}
    </main>
  );
}

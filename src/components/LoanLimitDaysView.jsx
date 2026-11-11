import { useMemo, useState } from 'react';
import { calculateLoanLimitDays } from '../utils/calculations.js';
import { formatCurrency } from '../utils/formatters.js';

export function LoanLimitDaysView() {
  const [rule, setRule] = useState('post'); // 'post' | 'pre'
  const [isLeapYear, setIsLeapYear] = useState(false); // false (365) | true (366)
  const [descStyle, setDescStyle] = useState('simple'); // 'simple' | 'detailed'
  const [periods, setPeriods] = useState([
    { id: 'loan-1', name: 'Loan 1', rate: '6.5', days: '120' },
  ]);
  const [copied, setCopied] = useState('');

  // Date Range Calculator State
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [isInclusive, setIsInclusive] = useState(true);
  const [selectedTargetLoanIndex, setSelectedTargetLoanIndex] = useState(0);
  const [dateCalcFeedback, setDateCalcFeedback] = useState('');

  const yearDays = isLeapYear ? 366 : 365;

  const updatePeriod = (index, key, value) => {
    setPeriods((current) => {
      const next = [...current];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addPeriod = () => {
    setPeriods((current) => [
      ...current,
      {
        id: `loan-${current.length + 1}`,
        name: `Loan ${current.length + 1}`,
        rate: '',
        days: '',
      },
    ]);
  };

  const removePeriod = (index) => {
    setPeriods((current) => current.filter((_, i) => i !== index));
    if (selectedTargetLoanIndex >= index && selectedTargetLoanIndex > 0) {
      setSelectedTargetLoanIndex((prev) => prev - 1);
    }
  };

  const setPresetDays = (index, days) => {
    updatePeriod(index, 'days', String(days));
  };

  // Date difference calculation logic
  const dateDiffResult = useMemo(() => {
    if (!calcStartDate || !calcEndDate) return null;

    const start = new Date(calcStartDate + 'T00:00:00');
    const end = new Date(calcEndDate + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { error: 'Invalid date entered' };
    }

    if (end < start) {
      return { error: 'End date cannot be earlier than start date' };
    }

    const diffMs = end.getTime() - start.getTime();
    const rawDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const finalDays = rawDays + (isInclusive ? 1 : 0);

    // Detect if February 29 occurs within the range
    let includesLeapDay = false;
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    for (let yr = startYear; yr <= endYear; yr++) {
      const feb29 = new Date(yr, 1, 29);
      if (feb29.getMonth() === 1 && feb29.getDate() === 29 && feb29 >= start && feb29 <= end) {
        includesLeapDay = true;
        break;
      }
    }

    const startFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endFormatted = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      days: finalDays,
      startFormatted,
      endFormatted,
      includesLeapDay,
    };
  }, [calcStartDate, calcEndDate, isInclusive]);

  const applyCalculatedDaysToLoan = (targetIdx = selectedTargetLoanIndex) => {
    if (!dateDiffResult || dateDiffResult.error || dateDiffResult.days <= 0) return;
    const idx = Math.min(targetIdx, periods.length - 1);
    updatePeriod(idx, 'days', String(dateDiffResult.days));

    if (dateDiffResult.includesLeapDay && !isLeapYear) {
      setIsLeapYear(true);
    }

    const targetName = periods[idx]?.name || `Loan ${idx + 1}`;
    setDateCalcFeedback(`✓ Applied ${dateDiffResult.days} days to ${targetName}`);
    setTimeout(() => setDateCalcFeedback(''), 2500);
  };

  const applyQuarterPreset = (quarter) => {
    const currentYear = new Date().getFullYear();
    if (quarter === 'Q1') {
      setCalcStartDate(`${currentYear}-01-01`);
      setCalcEndDate(`${currentYear}-03-31`);
    } else if (quarter === 'Q2') {
      setCalcStartDate(`${currentYear}-04-01`);
      setCalcEndDate(`${currentYear}-06-30`);
    } else if (quarter === 'Q3') {
      setCalcStartDate(`${currentYear}-07-01`);
      setCalcEndDate(`${currentYear}-09-30`);
    } else if (quarter === 'Q4') {
      setCalcStartDate(`${currentYear}-10-01`);
      setCalcEndDate(`${currentYear}-12-31`);
    } else if (quarter === 'H1') {
      setCalcStartDate(`${currentYear}-01-01`);
      setCalcEndDate(`${currentYear}-06-30`);
    } else if (quarter === 'H2') {
      setCalcStartDate(`${currentYear}-07-01`);
      setCalcEndDate(`${currentYear}-12-31`);
    } else if (quarter === 'FY') {
      setCalcStartDate(`${currentYear}-01-01`);
      setCalcEndDate(`${currentYear}-12-31`);
    }
  };

  const result = useMemo(() => {
    return calculateLoanLimitDays({
      rule,
      isLeapYear,
      periods,
      descStyle,
    });
  }, [rule, isLeapYear, periods, descStyle]);

  const copy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  };

  const fedDailyLimit = (result.fedLimit * (parseFloat(periods[0]?.rate) || 0)) / (100 * yearDays);
  const stateDailyLimit = (result.stateCap * (parseFloat(periods[0]?.rate) || 0)) / (100 * yearDays);

  return (
    <section className="mx-auto max-w-7xl px-3.5 sm:px-5 py-5 sm:py-8">
      {/* Title Header */}
      <div className="mb-6 sm:mb-7 max-w-2xl">
        <p className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-600">
          Day-Based Mortgage Limit Worksheet
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Loan Limit Days Calculation
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Calculate allowable interest pro-rated by active days during the tax year using the statutory
          loan limit formula: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-blue-700 break-all">(Limit × Interest Rate% × Days) ÷ (100 × Days in Year)</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.06fr_.94fr]">
        {/* Left Column: Form Controls & Date Calculator */}
        <div className="space-y-5">
          {/* Acquisition Date Rule */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold text-slate-700">Acquisition date rule</p>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRule('pre')}
                className={`rounded-xl border p-3 text-left transition ${
                  rule === 'pre'
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <b className="block text-sm sm:text-base">Pre-2017</b>
                <span className="text-xs text-slate-500">
                  Acquired on/before Dec. 15, 2017 · $1M Limit
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRule('post')}
                className={`rounded-xl border p-3 text-left transition ${
                  rule === 'post'
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <b className="block text-sm sm:text-base">Post-2017</b>
                <span className="text-xs text-slate-500">
                  Acquired after Dec. 15, 2017 · $750K Federal / $1M State
                </span>
              </button>
            </div>
          </div>

          {/* Tax Year Type (Regular vs Leap Year) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div>
                <p className="text-sm font-bold text-slate-700">Tax year basis</p>
                <p className="text-xs text-slate-500">Select standard (365 days) or leap year (366 days)</p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {yearDays} days denominator
              </span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsLeapYear(false)}
                className={`flex items-center justify-between rounded-xl border p-3 transition ${
                  !isLeapYear
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-left">
                  <span className="block text-sm font-bold">Standard Year</span>
                  <span className="text-xs text-slate-500">365 Days</span>
                </div>
                {!isLeapYear && <span className="text-blue-600 font-bold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setIsLeapYear(true)}
                className={`flex items-center justify-between rounded-xl border p-3 transition ${
                  isLeapYear
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="text-left">
                  <span className="block text-sm font-bold">Leap Year</span>
                  <span className="text-xs text-slate-500">366 Days</span>
                </div>
                {isLeapYear && <span className="text-blue-600 font-bold">✓</span>}
              </button>
            </div>
          </div>

          {/* Date Range to Days Calculator Card */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shrink-0">
                  📅
                </span>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900">Date Range Days Calculator</p>
                  <p className="text-xs text-slate-500">Calculate exact calendar days between two dates</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                Exact Calendar Math
              </span>
            </div>

            {/* Date Inputs */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Start date</span>
                <input
                  type="date"
                  value={calcStartDate}
                  onChange={(e) => setCalcStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">End date</span>
                <input
                  type="date"
                  value={calcEndDate}
                  onChange={(e) => setCalcEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {/* Counting Option & Presets */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isInclusive}
                  onChange={(e) => setIsInclusive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Include both start & end dates (standard)</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-0.5">Presets:</span>
                {['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'FY'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => applyQuarterPreset(q)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Result & Apply Action */}
            {dateDiffResult && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
                {dateDiffResult.error ? (
                  <p className="text-xs font-semibold text-rose-600">{dateDiffResult.error}</p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-blue-700">
                          {dateDiffResult.days}
                        </span>
                        <span className="text-sm font-bold text-slate-700">days</span>
                        <span className="text-xs font-medium text-slate-500">
                          ({((dateDiffResult.days / yearDays) * 100).toFixed(1)}% of {yearDays} days)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">
                        {dateDiffResult.startFormatted} → {dateDiffResult.endFormatted}{' '}
                        {isInclusive ? '(inclusive)' : '(exclusive of end day)'}
                      </p>
                      {dateDiffResult.includesLeapDay && (
                        <p className="mt-1 text-[11px] font-semibold text-blue-800">
                          ℹ️ Spans Feb 29 (Leap Day detected)
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {periods.length > 1 ? (
                        <select
                          value={selectedTargetLoanIndex}
                          onChange={(e) => setSelectedTargetLoanIndex(Number(e.target.value))}
                          className="flex-1 sm:flex-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                        >
                          {periods.map((p, idx) => (
                            <option key={p.id || idx} value={idx}>
                              Apply to {p.name}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => applyCalculatedDaysToLoan(selectedTargetLoanIndex)}
                        className="flex-1 sm:flex-none rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition text-center"
                      >
                        Apply to {periods[selectedTargetLoanIndex]?.name || 'Loan 1'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {dateCalcFeedback && (
              <p className="mt-2 text-center text-xs font-bold text-emerald-600 animate-fade-in">
                {dateCalcFeedback}
              </p>
            )}
          </div>

          {/* Loan Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-sm sm:text-base text-slate-900">Loan & active period details</p>
                <p className="text-xs text-slate-500">
                  Enter annual interest rate (%) and active days out of {yearDays}
                </p>
              </div>
              <button
                type="button"
                onClick={addPeriod}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                + Add loan period
              </button>
            </div>

            <div className="space-y-4">
              {periods.map((period, i) => {
                const rowCalc = result.rows[i] || {};
                return (
                  <div key={period.id || i} className="rounded-xl bg-slate-50 p-3.5 sm:p-4 border border-slate-100">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <b className="text-sm text-slate-800">{period.name}</b>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTargetLoanIndex(i);
                            if (dateDiffResult && dateDiffResult.days > 0) {
                              applyCalculatedDaysToLoan(i);
                            }
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Use date calculator
                        </button>
                        {periods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePeriod(i)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {/* Interest Rate */}
                      <label className="block">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Interest rate</span>
                          <span className="text-[11px] font-bold text-blue-600">Annual %</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={period.rate}
                            onChange={(e) => updatePeriod(i, 'rate', e.target.value)}
                            placeholder="e.g. 6.50"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                          <span className="pointer-events-none absolute right-3 top-2.5 font-bold text-slate-400">
                            %
                          </span>
                        </div>
                      </label>

                      {/* Number of Days */}
                      <label className="block">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Number of days</span>
                          <span className="text-[11px] font-bold text-slate-500">out of {yearDays}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={yearDays}
                            step="1"
                            value={period.days}
                            onChange={(e) => updatePeriod(i, 'days', e.target.value)}
                            placeholder={`e.g. 120`}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-12 text-base sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                          <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                            days
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Quick Preset Buttons for Days */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setPresetDays(i, yearDays)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Full Year ({yearDays} d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDays(i, Math.round(yearDays / 2))}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Half Year ({Math.round(yearDays / 2)} d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDays(i, 90)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        90 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDays(i, 30)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        30 Days
                      </button>
                    </div>

                    {/* Real-time Row Calculation Pill */}
                    {rowCalc.rateNum > 0 && rowCalc.daysNum > 0 && (
                      <div className="mt-3 flex flex-col xs:flex-row xs:items-center justify-between gap-2 rounded-lg bg-blue-50/70 px-3 py-2 text-xs text-blue-900 border border-blue-100">
                        <div className="break-words">
                          Federal: <b>{formatCurrency(rowCalc.fedAmount)}</b>
                          {rule === 'post' && (
                            <span className="ml-2 text-emerald-800">
                              · Add’l State: <b>{formatCurrency(rowCalc.stateAdditional)}</b>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-blue-700 shrink-0">
                          {((rowCalc.daysNum / yearDays) * 100).toFixed(1)}% of year
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Eligible Deduction & Drake Return Statements */}
        <div className="space-y-5">
          {/* Dark Summary Card */}
          <div className="rounded-2xl bg-slate-950 p-5 sm:p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-blue-300">
                Eligible day-pro-rated deduction
              </p>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                {rule === 'pre' ? 'Pre-2017 ($1M)' : 'Post-2017 ($750K)'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Federal Deductible</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">
                  {formatCurrency(result.totalFed)}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                  Limit: {formatCurrency(result.fedLimit)}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
                <p className="text-xs sm:text-sm text-slate-400">Additional State</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-300 break-words">
                  {formatCurrency(result.totalAdditional)}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                  State Total: {formatCurrency(result.totalState)}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-300 flex flex-col gap-1">
              <div>
                Active days: <b className="text-white">{result.totalDays}</b> of <b className="text-white">{yearDays} days</b> ({((result.totalDays / yearDays) * 100).toFixed(1)}% of year)
              </div>
              <div className="text-[11px] text-slate-400 break-words">
                Formula: <code className="text-blue-300">({formatCurrency(result.fedLimit)} × Rate% × Days) ÷ (100 × {yearDays})</code>
              </div>
            </div>
          </div>

          {/* Drake Tax Return Description Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <p className="font-bold text-slate-900">Return description</p>
                <p className="text-xs text-slate-500">Copy individual lines into Drake Tax</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDescStyle('simple')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      descStyle === 'simple'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescStyle('detailed')}
                    className={`rounded-md px-2.5 py-1 transition ${
                      descStyle === 'detailed'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copy(result.lines.join('\n'), 'all')}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {copied === 'all' ? 'Copied all!' : 'Copy all'}
                </button>
              </div>
            </div>

            <div className="max-h-[440px] space-y-2 overflow-auto pr-1">
              {result.lines.map((line, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 sm:p-2.5"
                >
                  <p className="flex-1 font-mono text-xs sm:text-sm leading-5 text-slate-800 break-words min-w-0 pr-1">
                    {line}
                  </p>
                  <button
                    type="button"
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

      {/* Analytics & Accrual Studio */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-md bg-blue-100 px-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              Daily Accrual Analytics
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {yearDays}-Day Basis
            </span>
          </div>
          <h3 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">Statutory Rate & Accrual Insights</h3>
          <p className="text-xs text-slate-500">
            Compare statutory allowable interest growth per active calendar day.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Card 1: Federal Daily Accrual */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Federal Daily Accrual</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {formatCurrency(result.fedLimit)} Limit
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words">
                {formatCurrency(fedDailyLimit)} <span className="text-xs sm:text-sm font-normal text-slate-500">/ day</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Maximum deductible interest per active day
              </div>
            </div>
          </div>

          {/* Card 2: State Daily Accrual */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">State Daily Accrual</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {formatCurrency(result.stateCap)} Limit
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 break-words">
                {formatCurrency(stateDailyLimit)} <span className="text-xs sm:text-sm font-normal text-slate-500">/ day</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Maximum state allowable interest per day
              </div>
            </div>
          </div>

          {/* Card 3: Additional State Advantage */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Daily State Advantage</span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Gap Benefit
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-700 break-words">
                +{formatCurrency(Math.max(0, stateDailyLimit - fedDailyLimit))}{' '}
                <span className="text-xs sm:text-sm font-normal text-slate-500">/ day</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Extra state deduction generated daily
              </div>
            </div>
          </div>
        </div>

        {/* Year Coverage Progress Bar */}
        <div className="mt-6 rounded-xl bg-slate-50 p-3.5 sm:p-4 border border-slate-100">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs font-semibold text-slate-700 mb-2 gap-1">
            <span>Tax Year Active Duration Coverage</span>
            <span className="font-bold text-blue-700">
              {result.totalDays} of {yearDays} days ({((result.totalDays / yearDays) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, (result.totalDays / yearDays) * 100)}%`,
              }}
            />
          </div>
        </div>
      </section>

      <p className="mt-5 text-xs text-slate-500">
        Calculation aid only. Confirm acquisition debt, refinance tracing, state rules, and the applicable tax-year guidance before filing.
      </p>
    </section>
  );
}

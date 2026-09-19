export const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const formatCurrency = (val) => moneyFormatter.format(Number(val) || 0);

export const formatPercent = (val, decimals = 3) =>
  `${Number(val).toFixed(decimals)}%`;

export const parseNumber = (value) =>
  Math.max(0, Number(String(value ?? '').replace(/,/g, '')) || 0);

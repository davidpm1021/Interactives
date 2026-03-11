export function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function parseLoanAmount(raw: string): number {
  const stripped = raw.replace(/[^0-9.]/g, '');
  return parseFloat(stripped) || 0;
}

export function formatLoanAmountDisplay(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('en-US');
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

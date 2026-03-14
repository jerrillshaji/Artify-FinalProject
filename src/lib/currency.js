const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(amount) {
  const value = Number(amount || 0);
  return inrFormatter.format(Number.isFinite(value) ? value : 0);
}
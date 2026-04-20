export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(value: string): string {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string): string {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

export function toInputDate(value: Date = new Date()): string {
  return value.toISOString().slice(0, 10);
}

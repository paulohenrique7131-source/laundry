import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatDateTime, type HistoryRecord } from '@laundry/domain';

export async function shareHtmlDocument(html: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export function buildRecordHtml(record: HistoryRecord): string {
  const itemRows = record.items.map((item) => {
    if (item.priceLP !== undefined) {
      const rows: string[] = [];
      if ((item.qtyLP ?? 0) > 0) {
        rows.push(`<tr><td>${item.name} (LP)</td><td>${item.qtyLP}</td><td>${formatCurrency(item.priceLP || 0)}</td><td>${formatCurrency((item.priceLP || 0) * (item.qtyLP || 0))}</td></tr>`);
      }
      if (item.priceP != null && (item.qtyP ?? 0) > 0) {
        rows.push(`<tr><td>${item.name} (P)</td><td>${item.qtyP}</td><td>${formatCurrency(item.priceP || 0)}</td><td>${formatCurrency((item.priceP || 0) * (item.qtyP || 0))}</td></tr>`);
      }
      return rows.join('');
    }

    return `<tr><td>${item.name}</td><td>${item.qty || 0}</td><td>${formatCurrency(item.price || 0)}</td><td>${formatCurrency(item.lineTotal)}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #111827; }
h1 { font-size: 24px; margin: 0 0 8px; }
p { color: #6b7280; font-size: 13px; margin: 0 0 16px; }
table { width: 100%; border-collapse: collapse; margin-top: 18px; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 13px; }
th { background: #111827; color: white; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
.total { margin-top: 18px; font-size: 20px; font-weight: 800; color: #d97706; }
.note { margin-top: 18px; padding: 14px; background: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 12px; }
</style>
</head>
<body>
  <h1>Lavanderia • ${record.type}</h1>
  <p>Data ${record.date} • Serviço ${record.serviceType} • Criado ${formatDateTime(record.createdAt)}</p>
  <table>
    <thead><tr><th>Item</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  ${record.notes ? `<div class="note"><strong>Observações</strong><br/>${record.notes.replace(/\n/g, '<br/>')}</div>` : ''}
  <div class="total">Total ${formatCurrency(record.total)}</div>
</body>
</html>`;
}

export function buildComandaHtml(params: {
  title: string;
  serviceType: string;
  subtotal: number;
  total: number;
  items: Array<{ name: string; qty: string; unitPrice: string; total: string }>;
}) {
  const rows = params.items
    .map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.unitPrice}</td><td>${item.total}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 28px; color: #111827; }
h1 { font-size: 22px; margin-bottom: 6px; }
p { color: #6b7280; font-size: 13px; margin-top: 0; }
table { width: 100%; border-collapse: collapse; margin-top: 18px; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 13px; }
th { background: #111827; color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.summary { margin-top: 18px; padding-top: 14px; border-top: 2px solid #f59e0b; }
.summary p { color: #111827; margin-bottom: 8px; }
</style>
</head>
<body>
  <h1>${params.title}</h1>
  <p>Tipo de serviço ${params.serviceType}</p>
  <table>
    <thead><tr><th>Item</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <p>Subtotal ${formatCurrency(params.subtotal)}</p>
    <p><strong>Total ${formatCurrency(params.total)}</strong></p>
  </div>
</body>
</html>`;
}

export function buildStatisticsHtml(params: {
  start: string;
  end: string;
  typeFilter: string;
  totalValue: number;
  costByCategory: Record<string, number>;
  volumeByCategory: Record<string, number>;
  trendByDay: Record<string, number>;
}) {
  const costRows = Object.entries(params.costByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => `<tr><td>${label}</td><td>${formatCurrency(value)}</td></tr>`)
    .join('');
  const volumeRows = Object.entries(params.volumeByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
    .join('');
  const trendRows = Object.entries(params.trendByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => `<tr><td>${label}</td><td>${formatCurrency(value)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 28px; color: #111827; }
h1 { font-size: 24px; margin-bottom: 8px; }
h2 { font-size: 16px; margin: 26px 0 10px; }
p { color: #6b7280; font-size: 13px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 13px; }
th { background: #111827; color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.highlight { margin-top: 18px; font-size: 22px; font-weight: 800; color: #d97706; }
</style>
</head>
<body>
  <h1>Estatísticas</h1>
  <p>Período ${params.start} até ${params.end} • Filtro ${params.typeFilter}</p>
  <div class="highlight">Total ${formatCurrency(params.totalValue)}</div>
  <h2>Custo por categoria</h2>
  <table><thead><tr><th>Categoria</th><th>Total</th></tr></thead><tbody>${costRows}</tbody></table>
  <h2>Volume por categoria</h2>
  <table><thead><tr><th>Categoria</th><th>Quantidade</th></tr></thead><tbody>${volumeRows}</tbody></table>
  <h2>Tendência diária</h2>
  <table><thead><tr><th>Data</th><th>Total</th></tr></thead><tbody>${trendRows}</tbody></table>
</body>
</html>`;
}

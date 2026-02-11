# 🧺 Lavanderia (Local)

Sistema profissional de gestão de lavanderia com armazenamento 100% local.

## 🚀 Setup

```bash
cd Laundry/laundry
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📋 Funcionalidades

### Calculadora
- Switch Serviços / Enxoval
- Preços LP e P com controles de quantidade
- Multiplicadores: Normal (×1.0), Expresso (×1.5), Urgente (×2.0)
- Itens extras com opção "Tornar permanente"
- Gerar comanda para impressão
- Salvar no histórico

### Dashboard
- Filtro por período e tipo
- Ordenação clicável (data, tipo, total)
- Detalhes, edição e exclusão de registros
- Consolidado imprimível
- Backup em PDF

### Estatísticas
- Gráficos: Doughnut (custo), Bar (volume), Line (tendência)
- Filtros: 7d, 30d, 90d, custom
- Relatório imprimível com gráficos

### Notas
- Editor rich text (Bold, Italic, Underline)
- CRUD com sanitização HTML
- Data de criação e edição

### Configurações
- Gerenciar catálogo Serviços/Enxoval
- Restaurar padrão, exportar/importar JSON
- Toggle dark/light
- Ajustar blur e opacidade dos cards

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) | Framework |
| TypeScript | Tipagem |
| Tailwind CSS | Estilos |
| Dexie (IndexedDB) | Persistência local |
| Chart.js | Gráficos |
| jsPDF + autoTable | PDFs |

## 📁 Estrutura

```
src/
├── app/         → Rotas (calculator, dashboard, statistics, notes, settings)
├── components/  → Componentes por feature
├── context/     → AppContext, ToastContext
├── data/        → Dados default dos catálogos
├── storage/     → Camada IndexedDB (Dexie)
└── types/       → TypeScript interfaces
```

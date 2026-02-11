# 🎨 UI Style Guide — Lavanderia

## Referências Visuais

O design do app foi extraído de 5 imagens de referência glassmorphism que apresentam:
- Dashboards financeiros com cards translúcidos
- Smart home interfaces com fundo escuro
- Trail/hiking app com layout premium

## Elementos Visuais Extraídos

### Cores
- **Background**: Deep dark (#0a0a0f) com gradientes radiais sutis
- **Accent**: Âmbar/Laranja (#f59e0b → #d97706) — inspirado nos dashboards financeiros
- **Textos**: Brancos em hierarquia (primary #f0f0f5, secondary #a0a0b8, muted #6b6b80)
- **Status**: Emerald (sucesso), Red (perigo), Sky (info)

### Glassmorphism
- **Card backgrounds**: `rgba(255, 255, 255, 0.06)` com backdrop-blur 16px
- **Borders**: `rgba(255, 255, 255, 0.1)` — bordas sutis e translúcidas
- **Hover**: Backgrounds mais claros + glow âmbar sutil
- **Shadows**: Profundas (`0 8px 32px rgba(0,0,0,0.4)`) + glow accent

### Tipografia
- **Font**: Inter (Google Fonts) — pesos 300 a 800
- **Labels**: 12px uppercase tracking `0.05em` em cor muted
- **Headers**: Bold com text-gradient (âmbar → laranja)

### Animações
- **fadeIn**: opacity 0→1 + translateY 8px→0 (0.4s ease-out)
- **slideUp**: translateY 20px→0 para toasts
- **scaleIn**: scale 0.95→1 para modais
- **pulse-glow**: box-shadow pulsante no accent
- **Stagger**: Delay incremental nos filhos (.05s por item)

### Componentes
- **Buttons**: Gradientes com box-shadow, hover translateY(-1px), active scale(0.97)
- **Inputs**: Glass background com focus border accent + glow ring
- **Tables**: Borders sutis, hover rows, zebra sutil
- **Pill Switch**: Tabs compactas com active gradient
- **Qty Controls**: ±/input inline com hover accent

### Sidebar
- Fixa à esquerda (260px) com glass background
- Logo com gradiente âmbar
- Items com active glow e dot pulsante
- Theme toggle com slider animado

### Dark → Light
- Transição suave (0.5s) via CSS custom properties
- Light: backgrounds mais claros, glass com opacity maior
- Mesmas cores accent e mesma estrutura

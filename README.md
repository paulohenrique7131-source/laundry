# Laundry Monorepo

Sistema de lavanderia com duas superfícies oficiais do mesmo produto:

- `apps/web`: Next.js, fonte principal da verdade do produto
- `apps/mobile`: Expo + React Native, app Android nativo
- `packages/domain`: tipos, regras e cálculos compartilhados
- `packages/data`: repositório Supabase compartilhado
- `packages/theme`: tokens visuais compartilhados

## Stack real

- Next.js 16 + React 19
- Expo SDK 55 + React Native 0.83 + Expo Router
- Supabase Auth + Postgres
- TypeScript
- React Query
- react-native-svg

## Estrutura

```txt
apps/
  web/
  mobile/
packages/
  domain/
  data/
  theme/
supabase/
  migrations/
archive/
```

## Requisitos

### Web

- Node.js 22+
- npm 10+

### Android

- Node.js 22+
- npm 10+
- JDK 17+
- Android Studio
- Android SDK
- `adb` configurado no PATH

## Ambiente

### Web

`apps/web/.env.local`

Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Mobile

Use as equivalentes do Expo no ambiente do app:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Scripts do monorepo

Na raiz do repositório:

```bash
npm install
npm run dev:web
npm run build:web
npm run start:mobile
npm run android
npm run prebuild:android
```

## Fluxo Android

### 1. Validar bundle JS

```bash
cd apps/mobile
npx expo export --platform android
```

### 2. Gerar/atualizar nativo

```bash
cd apps/mobile
npx expo prebuild --platform android
```

### 3. Abrir no Android Studio

Abra:

```txt
apps/mobile/android
```

## Observações importantes

- O web continua intacto dentro de `apps/web`.
- A lógica compartilhada fica em `packages/*`; a UI não é compartilhada entre web e mobile.
- O mobile usa sessão persistente segura via Supabase + Secure Store.
- O app Android é nativo; não usa WebView.
- O diretório `apps/mobile/android` é gerado por prebuild e está pronto para Android Studio.

## Migrações Supabase

Este repositório inclui migrações para alinhar o banco ao produto atual, incluindo:

- `supabase/migrations/20260212_notes_messaging.sql`
- `supabase/migrations/20260414_history_notes_alignment.sql`

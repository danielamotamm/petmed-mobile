# PetMed — Guia para Agentes

App mobile de lembretes de medicação para pets, com backend sincronizado.

## Arquitetura: monorepo fullstack

Este repositório contém **duas partes com runtimes distintos**:

| Pasta | Runtime | Onde roda | Papel |
|---|---|---|---|
| `app/`, `components/`, `hooks/`, `lib/`, `constants/` | Hermes (React Native) / web | Dispositivo do usuário | App Expo (cliente) |
| `server/` | Node.js | Servidor na nuvem | API Express + tRPC |
| `shared/` | Ambos | — | Tipos e constantes compartilhados |
| `drizzle/` | Node.js (migrações/schema) | CI/servidor | Schema do MySQL |

### Regras de fronteira (críticas)

1. **O app nunca importa `server/`.** A única exceção é `lib/trpc.ts`, que importa apenas o *tipo* `AppRouter` (apagado em tempo de compilação). O app fala com o backend exclusivamente via HTTP/tRPC (`getApiBaseUrl()` em `constants/oauth.ts`).
2. **O app nunca se conecta ao banco.** O Drizzle usa o driver `mysql2` (remoto). Não usar `drizzle-orm/expo-sqlite` — o PetMed não é offline-first; a persistência local via AsyncStorage foi descontinuada.
3. **Chaves de API e segredos vivem só no servidor** (`server/_core/env.ts`). Nunca criar variáveis `EXPO_PUBLIC_*` com segredos — builds de app são descompiláveis. Serviços de IA (`server/_core/llm.ts`, `imageGeneration.ts`) só podem ser chamados pelo backend.

## Autenticação

- OAuth via provedor externo (Manus), fluxo em `constants/oauth.ts` → `app/oauth/callback.tsx`.
- **Scheme do standalone:** `petmed://` — fixo em `app.config.ts` (`scheme`) e espelhado em `constants/oauth.ts`. O redirect URI `petmed://oauth/callback` precisa estar registrado no provedor OAuth. Em Expo Go o runtime sobrescreve o scheme.
- **Build standalone:** `eas.json` com perfis `development` (dev client), `preview` (APK interno) e `production`. Validar o fluxo OAuth de ponta a ponta exige um build EAS — o scheme não é exercitado no preview web.
- **Nativo:** sessão via Bearer token guardado em `expo-secure-store` (`lib/_core/auth.ts`). Nunca usar AsyncStorage para tokens.
- **Web:** sessão via cookie `app_session_id` (`credentials: "include"`).
- **Guarda central:** `AuthGate` em `app/_layout.tsx` redireciona deslogados para `/login`. Telas não devem implementar verificação própria de login.
- O estado OAuth é assinado/validado (`oauth-state` no SecureStore no nativo; endpoint `/api/oauth/state` na web).

## Domínio PetMed

- **Schema** (`drizzle/schema.ts`): `pets`, `medicationTreatments` (com `startDate`/`endDate` YYYY-MM-DD + `timezone`), `treatmentSchedules` (horários HH:MM), `doseOccurrences` (uma linha por dose agendada, `scheduledAt` em UTC).
- **API** (`server/petmedRouter.ts`): `petmed.pets.*`, `petmed.treatments.*`, `petmed.doses.*` — tudo `protectedProcedure` com escopo por `ctx.user.id`.
- **Criação de tratamento** gera todas as `doseOccurrences` em transação, convertendo horário local → UTC com correção de DST (`getUtcDate` em `server/db.ts`).
- **Doses perdidas:** marcação *lazy* — antes de cada listagem, pendentes vencidas há mais de 2h viram `missed` (`markOverdueDosesAsMissed`). Não há cron job.
- **Tipos compartilhados** do domínio: `shared/petmed.ts` (`MedicationUnit`, `DoseStatus`, `PetSummary`, `DoseWithDetails`).

## Notificações locais

- `lib/notifications.ts` é a espinha dorsal dos lembretes: `expo-notifications` **local** (funciona offline/app fechado). Não depende de push remoto.
- Ao criar tratamento, agenda as próximas **60 ocorrências** (limite do iOS ~64) com trigger de data exata; re-sync ao abrir a agenda.
- Identificadores com prefixo `petmed-dose-{treatmentId}-` permitem cancelar ao encerrar tratamento.
- Tudo é noop na web (`Platform.OS === "web"`).

## Navegação e UI

- Rotas em `app/` com expo-router: tabs `(tabs)/` = Hoje, Pets, Histórico, Mais; modais `pet/new`, `medication/new`, `login` (fullScreenModal); `pet/[id]` = perfil.
- `app/dev/theme-lab.tsx` é **dev-only** (guarda `__DEV__`).
- Layout sempre via `components/screen-container.tsx` (SafeArea com `edges` granulares) + tokens de `useColors()`/`constants/theme.ts`.
- `StyleSheet` para estilos; NativeWind disponível, mas `Pressable` usa style (remap em `lib/_core/nativewind-pressable.ts`).

## Comandos

```bash
pnpm dev          # API (3000) + Metro web (8081) — no Windows, ver nota abaixo
pnpm dev:server   # só a API (tsx watch)
pnpm check        # tsc --noEmit
pnpm lint         # expo lint
pnpm test         # vitest
pnpm db:push      # drizzle-kit generate + migrate
pnpm build        # bundle do servidor (esbuild → dist/)
pnpm start        # servidor em produção (node dist/index.js)
```

> **Windows/PowerShell:** o script `dev:metro` usa interpolação bash `${EXPO_PORT:-8081}` que quebra no PowerShell. Suba os processos separadamente ou use porta fixa (`npx expo start --web --port 8081`).

## Variáveis de ambiente (servidor)

Obrigatórias em produção (`validateProductionEnvironment` em `server/_core/env.ts`):
`VITE_APP_ID`, `JWT_SECRET` (≥32 chars), `DATABASE_URL`, `OAUTH_SERVER_URL`, `CORS_ALLOWED_ORIGINS`. Sem `DATABASE_URL` o servidor sobe, mas as rotas do PetMed falham; sem `OAUTH_SERVER_URL` o login não completa.

## Convenções

- Idioma da UI: **português (pt-BR)**; código e comentários em inglês.
- Commits: mensagens de checkpoint em português descrevendo a funcionalidade (ver `git log`).
- Sempre rodar `pnpm check`, `pnpm lint` e `pnpm test` antes de commitar.
- Pendências e escopo: `todo.md`; identidade visual: `design.md`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Do not run or build this project

**Never execute or compile any part of this repository.** No `npm run dev` / `start` / `build`, no `ng serve` / `ng build` / `ng test`, no `tsc` / `npx tsc --noEmit`, no `node src/index.ts`, no jobs and no bot — not even "just once" to check that an edit compiles. The commands listed below document how *the user* runs each project; they are not an invitation to run them.

After editing, describe what changed and why, and stop there. Diagnostics the IDE sends on its own are a valid signal; producing them by running a build is not. If something genuinely cannot be settled without executing code, say so and let the user run it.

## Repository layout

Monorepo of three **independent** npm projects (there is no root `package.json` — always `cd` into the project first):

| Dir    | What it is | Dev port |
|--------|------------|----------|
| [back/](back/) | Express 5 + TypeORM (SQL Server) REST API for the LIGE/LINCE ERP | 3000 |
| [front/](front/) | Angular 21 SPA on ng-alain / @delon / ng-zorro-antd | 4200 |
| [mess/](mess/) | WhatsApp/Telegram bot (`@builderbot`) + small HTTP API, shares the same DB | 4000 |

`documentation/` holds hand-maintained architecture docs (mostly for `mess/`). `agents/` and `.kilo/skills/` contain prompt profiles/skills for other AI tools — `agents/skills/stack-context.skill.md` is a useful (though partly stale) project cheat-sheet.

## Commands

```bash
# back  (needs back/.env — copy from back/.env.example)
npm run dev      # node --watch on src/index.ts (Node runs .ts directly; no tsc step)
npm run jobs     # runs src/jobs.ts only
npm run build    # esbuild bundle -> back/dist (scripts/build.mjs, handles .node binaries + pdf worker)

# front
npm start        # ng serve with proxy.conf.json  (/api -> :3000, /mess/api -> :4000)
npm run build    # production build
npm run lint     # eslint --fix + stylelint
npm test         # karma/jasmine
ng test --include='**/api.service.spec.ts'   # single spec

# mess
npm run dev / npm run build / npm run prod
```

VS Code: the compound launch config **"Run Front + Back (dev)"** in [.vscode/launch.json](.vscode/launch.json) starts both.

These commands are run by the user, not by Claude — see [Do not run or build this project](#do-not-run-or-build-this-project).

## Backend architecture (`back/src`)

- **ESM with explicit `.ts` extensions in imports** (`import { X } from "./x.ts"`). `tsconfig.json` is `noEmit` + `allowImportingTsExtensions`; Node strips the types at runtime, esbuild bundles for prod.
- **No TypeORM entities.** `data-source.ts` exposes `getConnection(userName)` returning a `QueryRunner`; every controller writes raw parameterized T-SQL (`@0`, `@1`, …) and **must** `await queryRunner.release()` in `finally`.
- **Module = folder** with `<mod>.controller.ts` + `<mod>.routes.ts`. Older modules live in [back/src/controller/](back/src/controller/) + [back/src/routes/](back/src/routes/); new ones get their own top-level folder.
- Wiring a new module requires three edits: instantiate the controller as a singleton in [controller.module.ts](back/src/controller/controller.module.ts), export a `Router` in `<mod>.routes.ts`, and register it with `server.setRoute("/api/...", router)` in [routes.module.ts](back/src/routes/routes.module.ts).
- Controllers extend `BaseController` ([base.controller.ts](back/src/controller/base.controller.ts)) for `jsonRes()`, `hasGroup()`, `getGruposActividad()`, `hasAuthPersona()`, formatters.
- **Responses are enveloped**: `{ msg, data, stamp, ms }`. Throw `ClientException` (→409) or `ClientWarning` (→400) instead of writing error responses; async handlers take `next` and `return next(error)` so the `errorResponder` in [server.ts](back/src/server.ts) formats it (it also maps SQL Server error numbers 8152/547 to friendly messages).
- **Auth**: JWT in a `token` header. `authMiddleware.verifyToken` decodes it, extracts Active Directory groups (`CN=...`) into `req.groups` and fills `res.locals` (`userName`, `PersonalId`, `GrupoActividad`, refreshed from DB every 20 min). Route guards compose: `authMiddleware.hasGroup(['gSistemas'])`, `hasAuthResp()`, `hasAuthObjetivo`, `hasAuthByDocId()`, `filterSucursal`. `hasGroup` also passes when a previous middleware set `res.locals.verifyGrupoActividad / hasAuthObjetivo / authResp`, so ordering matters.
- **Scheduled jobs** are registered with `node-schedule` inline in [index.ts](back/src/index.ts) (nightly 00:0x tasks) and call controller methods with a mocked `req`/`null` res and a `(ret) => ret` callback.
- Logging: pino via [logger/](back/src/logger/) (worker thread + TypeORM logger). Config comes entirely from `back/.env`.

## Grid/list contract (backend ⇄ frontend)

Almost every screen follows this pattern — copy an existing module (e.g. [proveedores](back/src/proveedores/)) rather than inventing a new shape:

1. Backend declares a `columns` array (`id`, `field`, `fieldName` = real SQL column, `type`, `sortable`, `hidden`, `searchHidden`, optional `formatter`/`params.collection`) and serves it from `GET /api/<mod>/cols`.
2. `POST /api/<mod>/list` receives `{ options: { filtros, sort } }`; `filtrosToSql(options.filtros, columns)` and `orderToSQL(options.sort)` from [impuestos-afip/filtros-utils/filtros.ts](back/src/impuestos-afip/filtros-utils/filtros.ts) turn it into a `WHERE`/`ORDER BY` fragment.
3. Frontend component holds `listOptions = signal<listOptionsT>({filtros: [], sort: null})`, feeds `<app-filtro-builder>`, gets columns via `apiService.getCols('/api/<mod>/cols')` (which maps `formatter`/`type` strings to SlickGrid formatters/editors) and rows via a `resource()` loader, rendering with `angular-slickgrid` + `apiService.getDefaultGridOptions(...)`.

## Frontend architecture (`front/src/app`)

- **Standalone components**, `ChangeDetectionStrategy.OnPush`, signals (`signal`, `computed`, `resource`, `toSignal`); components import the `SHARED_IMPORTS` barrel from `@shared` ([shared-imports.ts](front/src/app/shared/shared-imports.ts)).
- Path aliases: `@shared`, `@core`, `@env/*`.
- Routes are lazy and grouped by area under [routes/](front/src/app/routes/): `ges` (main management screens), `lpv` (prices), `dto` (descuentos), `config`, `init` (dashboard), `passport` (login). Tabbed screens use a `:tab` route param with a `redirectTo` for the default tab.
- **The sidebar menu is data, not code**: [front/src/assets/app-data.json](front/src/assets/app-data.json) is loaded by [startup.service.ts](front/src/app/core/startup/startup.service.ts). A new screen needs a route entry *and* a menu entry there.
- HTTP goes through `ApiService` ([services/api.service.ts](front/src/app/services/api.service.ts)) — a large, flat facade over `_HttpClient` — which also unwraps the `{msg, data}` envelope and surfaces `msg` through `NzNotificationService`. Auth token handling lives in [core/net/](front/src/app/core/net/).
- Reusable pickers/editors live in [shared/](front/src/app/shared/) (`*-search`, `editor-*`, drawers). Prefer reusing one over a new autocomplete.
- Styling is Less (ng-alain themes); `@delon/mock` mock data is active in the dev environment.

## mess/

`index.ts` boots a `DBServer`, a `WebServer` and a `BotServer` (provider selected by `PROVIDER` env: baileys/meta/telegram). Conversation logic is one file per flow in [mess/src/flow/](mess/src/flow/); HTTP endpoints mirror the back/ pattern (`routes.module.ts` + controllers). It queues outbound messages from the DB on a cron when `ENABLE_QUEUE_MSGS` is set, and self-`exit()`s at 07:00 expecting a supervisor to restart it.

## Conventions

- Code, comments, commit messages, log text and user-facing strings are in **Spanish**; DB columns use PascalCase Spanish names (`PersonalId`, `ObjetivoId`, `GrupoActividadId`).
- Periods are almost always passed as `anio` / `mes` numbers, with date ranges expressed as `Desde` / `ISNULL(Hasta,'9999-12-31')` — `9999-12-31` means "open ended" and is rendered as "sin fecha".
- `gSistemas` is the systems/read-only AD group used as the default guard on new admin screens.

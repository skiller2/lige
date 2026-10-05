---
name: stack-context
description: Contexto tecnico del proyecto LIGE/LINCE (back/, front/, mess/). Contiene stack, estructura, receta para navegar el codigo, errores tipicos, tablas DB conocidas y convenciones. Usar antes de proponer nombres de endpoints, controllers o componentes, y antes de diagnosticar o refactorizar.
---

# Skill: stack-context

## Stack tecnologico
Son tres proyectos npm independientes (no hay `package.json` en la raiz).

| Carpeta | Que es | Puerto dev |
|---|---|---|
| `back/` | API REST Express 5 + SQL Server | 3000 |
| `front/` | SPA Angular 21 con ng-alain / @delon / ng-zorro-antd | 4200 |
| `mess/` | Bot WhatsApp/Telegram (`@builderbot`) + API HTTP chica, misma DB | 4000 |

### Backend (`back/src/`)
- **Runtime**: Node ejecuta los `.ts` directamente (type stripping, sin `tsx` ni `tsc`). ESM con imports que llevan extension `.ts` explicita. esbuild solo para el build de produccion.
- **Acceso a datos**: TypeORM se usa **solo como pool de conexiones**. No hay entidades ni repositorios. `getConnection(userName)` (`data-source.ts`) devuelve un `QueryRunner` y se escribe T-SQL a mano con parametros `@0`, `@1`, ...
- **Modulo = carpeta** con `<mod>.controller.ts` + `<mod>.routes.ts`. Los modulos viejos estan en `back/src/controller/` + `back/src/routes/`.
- **Alta de un modulo**: singleton en `controller/controller.module.ts`, `Router` en `<mod>.routes.ts` y `server.setRoute("/api/...", router)` en `routes/routes.module.ts`.
- **Respuestas**: siempre con envoltorio `{ msg, data, stamp, ms }` via `this.jsonRes()` de `BaseController`.
- **Errores**: lanzar `ClientException` (409) o `ClientWarning` (400), definidas en `controller/base.controller.ts`. Los handlers async hacen `return next(error)`. `errorResponder` (`server.ts`) traduce los errores SQL 8152 (truncado) y 547 (FK).
- **Auth**: JWT en el header `token`. `authMiddleware` (`middlewares/authJwt.ts`) expone `verifyToken`, `hasGroup([...])`, `hasAuthResp()`, `hasAuthObjetivo`, `hasAuthByDocId()` y `filterSucursal`. `hasGroup` tambien deja pasar si un middleware anterior seteo `res.locals.verifyGrupoActividad / hasAuthObjetivo / authResp`, por eso **el orden de los guards importa**.
- **Jobs**: `node-schedule` en `index.ts`. Llaman metodos de controllers con un `req` simulado, `res` en `null` y un callback `(ret) => ret`.
- **Logging**: pino (`logger/`). La configuracion sale de `back/.env`.

### Frontend (`front/src/app/`)
- Componentes standalone con `ChangeDetectionStrategy.OnPush`, que importan `SHARED_IMPORTS` desde `@shared`.
- Estado con signals: `signal`, `computed`, `resource`, `toSignal`. **El codigo nuevo usa `resource()`**; `BehaviorSubject` + `switchMap` es el patron viejo y sigue presente en muchas pantallas.
- HTTP via `ApiService` (`services/api.service.ts`), que desenvuelve `{msg, data}` y muestra `msg` con `NzNotificationService`. No llamar `_HttpClient` directo desde componentes.
- Grillas con `angular-slickgrid` + `apiService.getDefaultGridOptions(...)`.
- Rutas lazy por area en `routes/`: `ges` (gestion), `lpv` (precios), `dto` (descuentos), `config`, `init`, `passport`. Las pantallas con pestanas usan el parametro `:tab`.
- **El menu lateral es data**: `front/src/assets/app-data.json`. Una pantalla nueva necesita ruta **y** entrada de menu.
- Pickers y editores reutilizables en `shared/` (`*-search`, `editor-*`, drawers). Reusar antes de crear un autocomplete nuevo.

### Bot (`mess/src/`)
- `index.ts` levanta `DBServer`, `WebServer` y `BotServer`. El proveedor se elige con la variable `PROVIDER` (baileys/meta/telegram).
- Un archivo por conversacion en `flow/` (`flowLogin`, `flowMenu`, `flowRecibo`, ...). Los flows llaman controllers de `controller/` via `controller.module.ts`.
- Los endpoints HTTP siguen el patron de back (`routes/` + `controller/`), con su propio `middlewares/authJwt.ts` y su propio `data-source.ts`/`getConnection`.
- Con `ENABLE_QUEUE_MSGS` activo, un cron envia los mensajes encolados en la DB.
- El proceso hace `exit()` a las 07:00 y espera que un supervisor lo reinicie.

---

## Receta de navegacion (de sintoma a archivo)
- **Error con `archivo:linea`** → empezar por ese archivo.
- **Endpoint `/api/x/...`** → `routes/routes.module.ts` (buscar `"/api/x"`) → `x.routes.ts` (ruta + guards) → metodo en `x.controller.ts`.
- **Pantalla del front** → `routes/<area>/<area>.routes.ts` → componente → metodo de `ApiService` → endpoint.
- **Mensaje de error visible en pantalla** → buscar el texto literal en `back/src` o `mess/src` (son `ClientException` / `ClientWarning`).
- **Problema de grilla, filtro u orden** → el array `columns` del controller (el `fieldName` debe ser la columna SQL real) + `filtrosToSql` / `orderToSQL` en `back/src/impuestos-afip/filtros-utils/filtros.ts`.
- **Comportamiento del bot** → el `flow/flowX.ts` correspondiente → controller de `mess/src/controller/`.
- **Permiso denegado (403 / sin datos)** → guards en `x.routes.ts` + `middlewares/authJwt.ts`.
- **Modulo de referencia** para comparar con el patron correcto: `back/src/proveedores/`.

---

## Errores tipicos a revisar

### back/ y mess/
- `queryRunner` sin `await queryRunner.release()` en un `finally`. Deja conexiones del pool tomadas.
- `startTransaction()` sin `commitTransaction()` o `rollbackTransaction()` en todos los caminos, incluido el `catch`.
- SQL armado concatenando valores del request en vez de usar `@n`. Es un riesgo de inyeccion.
- Handler async que no hace `return next(error)`, o que escribe `res.status(...)` a mano en vez de lanzar `ClientException` / `ClientWarning`.
- Ruta sin guard, o con guards en un orden que hace pasar `hasGroup` por un `res.locals` seteado antes.
- Vigencias que usan `Hasta` sin `ISNULL(Hasta,'9999-12-31')`.
- `await queryRunner.query(...)` dentro de un `for` (el equivalente a un N+1 en este proyecto).
- `fieldName` de `columns` que no coincide con la columna SQL real, lo que rompe filtros y orden.
- Job en `index.ts` que llama un metodo que asume un `res` real.

### front/
- `.subscribe()` sin `takeUntilDestroyed()` ni cierre manual.
- Componente sin `OnPush`, o con estado mutable fuera de signals en codigo nuevo.
- `_HttpClient` usado directo en vez de `ApiService`.
- Autocomplete o picker nuevo cuando ya existe uno en `shared/`.
- Pantalla nueva sin entrada en `app-data.json`.
- Logica de negocio duplicada en el componente cuando ya la resuelve el backend.

---

## Controllers conocidos
| Controller | Ruta base | Responsabilidad |
|---|---|---|
| `personal.controller.ts` | `/api/personal` | Datos de personal/empleados |
| `recibos.controller.ts` | `/api/recibos` | Generacion y descarga de recibos de sueldo |
| `acceso-bot.controller.ts` | `/api/acceso-bot` | Registro de accesos al bot (telefono, WhatsApp) |
| `novedades.controller.ts` | `/api/novedades` | Novedades de liquidacion |
| `liquidaciones.controller.ts` | `/api/liquidaciones` | Liquidaciones de sueldos |
| `auth.controller.ts` | `/api/auth` | Autenticacion JWT |
| `evento-log.controller.ts` | `/api/evento-log` | Evento Log |
| `proveedores.controller.ts` | `/api/proveedores` | Modulo de referencia del patron grilla/lista |

### Controllers de uso transversal (`back/src/controller/`)
| Controller | Uso |
|---|---|
| `base.controller.ts` | Clase base: `jsonRes()`, `hasGroup()`, `getGruposActividad()`, `hasAuthPersona()`, formatters, `ClientException` / `ClientWarning` |
| `personal.controller.ts` | Consultas generales de personal |
| `asistencia.controller.ts` | Logica de asistencia |
| `file-upload.controller.ts` | Subida/descarga de archivos |

## Componentes Angular conocidos
| Componente | Ruta | Descripcion |
|---|---|---|
| `DetallAsistenciaComponent` | `ges/detalle-asistencia` | Vista de detalle de asistencia mensual |
| `DetallePersonaComponent` | `ges/detalle-persona` | Drawer con info detallada de persona |
| `AccesoBotComponent` | `ges/acceso-bot` | Listado de accesos bot |
| `AccesoBotFormComponent` | `ges/accesso-bot-form` | Formulario de acceso bot |
| `RecibosModalComponent` | `ges/recibos-modal` | Modal de recibos |
| `PersonalGrupoComponent` | `ges/personal-grupo` | Grupo de personal |
| `EventoLogComponent` | `ges/evento-log` | Grilla y ABM de Evento Log |

### Patron de drawer
```html
<nz-drawer [nzClosable]="false" [nzVisible]="visible()" [nzPlacement]="placement" [nzWidth]="640" nzTitle="Titulo">
  <ng-container *nzDrawerContent>
    <!-- contenido -->
  </ng-container>
</nz-drawer>
```
- La visibilidad se controla con `signal<boolean>(false)`.
- Placement `'right'` para datos secundarios y `'left'` para navegacion.
- Referencias: `personal-documentos-drawer`, `estudios-drawer`, `ayuda-asistencial-drawer`.

---

## Tablas DB conocidas (SQL Server)
| Tabla | Descripcion |
|---|---|
| `Personal` | Datos maestros del personal |
| `AccesoBot` | Registro de accesos y numeros de telefono del bot |
| `Recibos` / tablas de liquidacion | Recibos de sueldo generados |
| `EventoLog` | Log de eventos y acciones de usuarios, en curso y programados [A COMPLETAR: estructura exacta] |
| `EventoLogEstado` | Estados y colores asignados a Evento Log |
| `Novedades` | Novedades de liquidacion |
| `Asistencia` | Registros de asistencia |

---

## Convenciones del proyecto

### Idioma y nombres
- Codigo, comentarios, logs, mensajes al usuario y commits en espanol.
- Las columnas de la DB van en PascalCase en espanol (`PersonalId`, `ObjetivoId`, `GrupoActividadId`).
- Los periodos se pasan como `anio` / `mes`. Las vigencias usan `Desde` / `ISNULL(Hasta,'9999-12-31')`, y `9999-12-31` se muestra como "sin fecha".

### Endpoints
- Patron general: `GET|POST /api/[modulo]/[accion]`.
- Patron preferido para listas/tablas: `GET /api/[modulo]/get[Modulo][Subentidad]` (ej: `getEfectoDeposito`).
- Contrato de grillas: `GET /api/<mod>/cols` devuelve `columns` y `POST /api/<mod>/list` recibe `{ options: { filtros, sort } }`.

### Componentes
- Nombre preferido para grillas/tablas: `table-[subentidad]-[modulo].ts` (ej: `table-deposito-efecto.ts`).

### Permisos
- El grupo de solo consulta/lectura del area de sistemas es `gSistemas`. Es el guard por defecto en pantallas de administracion nuevas.

### Log / auditoria
- La tabla `EventoLog` registra acciones sensibles. Campos minimos conocidos: usuario, accion, timestamp [A COMPLETAR: schema completo].

---

## Notas
- Completar esta skill a medida que se descubran tablas, controllers o patrones nuevos.
- Los campos marcados [A COMPLETAR] se actualizan cuando se confirme la informacion.

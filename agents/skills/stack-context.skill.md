---
name: stack-context
description: Contexto tecnico del proyecto LIGE/LINCE. Contiene stack, estructura de carpetas, patrones de controllers, componentes Angular, tablas DB conocidas y convenciones del proyecto. Usar antes de proponer nombres de endpoints, controllers o componentes en tickets.
---

# Skill: stack-context

## Stack Tecnologico

### Backend
- **Runtime**: Node.js con TypeScript (ESM modules)
- **Framework**: Express 5
- **ORM**: TypeORM con SQL Server (`mssql`)
- **Build**: esbuild
- **Entrypoint**: `back/src/index.ts` → `back/src/server.ts`
- **Fuente de datos**: `back/src/data-source.ts`

### Frontend
- **Framework**: Angular 21
- **UI Library**: ng-zorro-antd (NZ Antd) — drawer, modal, table, form, etc.
- **State/HTTP**: `_HttpClient` de `@delon/theme`, `ApiService` propio
- **Grid**: `angular-slickgrid`
- **Build**: Angular CLI con esbuild

---

## Estructura de carpetas — Backend (`back/src/`)

Cada módulo sigue el patron:
```
back/src/[modulo]/
  [modulo].controller.ts   ← logica de negocio y SQL
  [modulo].routes.ts       ← definicion de rutas Express
```

### Controllers relevantes conocidos
| Controller | Ruta base | Responsabilidad |
|---|---|---|
| `personal.controller.ts` | `/api/personal` | Datos de personal/empleados |
| `recibos.controller.ts` | `/api/recibos` | Generacion y descarga de recibos de sueldo |
| `acceso-bot.controller.ts` | `/api/acceso-bot` | Registro de accesos al bot (telefono, WhatsApp) |
| `novedades.controller.ts` | `/api/novedades` | Novedades de liquidacion |
| `liquidaciones.controller.ts` | `/api/liquidaciones` | Liquidaciones de sueldos |
| `auth.controller.ts` | `/api/auth` | Autenticacion JWT |
| `procesos-automaticos.controller.ts` | `/api/procesos-automaticos` | Procesos Automaticos |

### Controllers de uso transversal (`back/src/controller/`)
| Controller | Uso |
|---|---|
| `base.controller.ts` | Clase base heredada por todos los controllers |
| `personal.controller.ts` | Consultas generales de personal |
| `asistencia.controller.ts` | Logica de asistencia |
| `file-upload.controller.ts` | Subida/descarga de archivos |

---

## Estructura de carpetas — Frontend (`front/src/app/`)

```
front/src/app/
  routes/
    ges/           ← modulo principal de gestion
      [pantalla]/
        [pantalla].component.ts
        [pantalla].component.html
        [pantalla].component.less
      ges.routes.ts
  shared/          ← componentes reutilizables
  services/
    api.service.ts
    search.service.ts
```

### Componentes Angular relevantes conocidos
| Componente | Ruta | Descripcion |
|---|---|---|
| `DetallAsistenciaComponent` | `ges/detalle-asistencia` | Vista de detalle de asistencia mensual |
| `DetallePersonaComponent` | `ges/detalle-persona` | Drawer con info detallada de persona |
| `AccesoBotComponent` | `ges/acceso-bot` | Listado de accesos bot |
| `AccesoBotFormComponent` | `ges/accesso-bot-form` | Formulario de acceso bot |
| `RecibosModalComponent` | `ges/recibos-modal` | Modal de recibos |
| `PersonalGrupoComponent` | `ges/personal-grupo` | Grupo de personal |
| `ProcesosAutomaticosComponent` | `ges/procesos-automaticos` | Grilla y ABM de procesos automaticos |

### Patron de Drawer en el proyecto
Los drawers se implementan con `nz-drawer` de ng-zorro-antd:
```html
<nz-drawer [nzClosable]="false" [nzVisible]="visible()" [nzPlacement]="placement" [nzWidth]="640" nzTitle="Titulo">
  <ng-container *nzDrawerContent>
    <!-- contenido -->
  </ng-container>
</nz-drawer>
```
- Visibilidad controlada con `signal<boolean>(false)` en el componente
- Placement tipico: `'right'` para datos secundarios, `'left'` para navigation
- Componentes drawer existentes como referencia: `personal-documentos-drawer`, `estudios-drawer`, `ayuda-asistencial-drawer`

---

## Tablas DB conocidas (SQL Server)
| Tabla | Descripcion |
|---|---|
| `Personal` | Datos maestros del personal |
| `AccesoBot` | Registro de accesos y numeros de telefono del bot |
| `Recibos` / tablas de liquidacion | Recibos de sueldo generados |
| `EventoLog` | Log de eventos y acciones de usuarios [A COMPLETAR: estructura exacta] |
| `Novedades` | Novedades de liquidacion |
| `Asistencia` | Registros de asistencia |
| `EventoLog` | Procesos automaticos en curso y programados |
| `EventoLogEstado` | Estados y colores asignados a procesos automaticos |

---

## Convenciones del proyecto

### Endpoints
- Patron: `GET|POST /api/[modulo]/[accion]`
- Autenticacion: JWT via middleware
- Parametros de lista: `{ options: { filtros, sort } }` via `POST`

### Servicios Angular
- HTTP via `ApiService` (`api.service.ts`) o `_HttpClient` de `@delon`
- Listas reactivas con `BehaviorSubject` + `switchMap`
- Signals para estado local: `signal()`, `computed()`

### Patrones de log / auditoria
- Tabla `EventoLog` para registrar acciones sensibles
- Campos minimos conocidos: usuario, accion, timestamp [A COMPLETAR: schema completo]

---

## Notas
- Completar esta skill a medida que se descubran nuevas tablas, controllers o patrones.
- Los campos marcados [A COMPLETAR] deben actualizarse cuando se confirme la informacion.

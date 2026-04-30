# Flujos de WhatsApp — Bot de Producción

> [!IMPORTANT]
> Estos flujos operan exclusivamente en el bot de WhatsApp de producción y **NO usan IA**. Están implementados con `@builderbot/bot` mediante keywords y regex.

## Visión General

El bot de producción utiliza la librería `@builderbot/bot` para definir flujos conversacionales con estados. Cada flujo es un archivo TypeScript en `mess/src/flow/` que exporta un `addKeyword()` con su lógica.

Todos los flujos se registran en `BotServer.init()` dentro de `bot-server.ts`.

## Listado de Flujos

### Autenticación y Sesión

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowLogin` | `flowLogin.ts` | Identificación por teléfono, validación contra `BotRegTelefonoPersonal` |
| `flowValidateCode` | `flowLogin.ts` | Validación del código de verificación (hasta 3 intentos) |
| `flowSinRegistrar` | `flowLogin.ts` | Flujo para usuarios no registrados (ofrece registro) |
| `flowMenu` | `flowMenu.ts` | Menú principal de opciones post-autenticación |
| `flowRemoveTel` | `flowRemoveTel.ts` | Desvinculación del teléfono |
| `idleFlow` | `flowIdle.ts` | Timeout por inactividad (5 min) |

### Documentos y Recibos

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowRecibo` | `flowRecibo.ts` | Descarga de recibos de retiro |
| `flowMonotributo` | `flowMonotributo.ts` | Descarga de comprobantes AFIP/Monotributo |
| `flowDescargaDocs` | `flowDescargaDocs.ts` | Documentación pendiente de descarga |

### Novedades (mayor complejidad — 32KB)

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowNovedad` | `flowNovedad.ts` | Punto de entrada para reportar novedad |
| `flowNovedadFecha` | `flowNovedad.ts` | Captura de fecha del incidente |
| `flowNovedadHora` | `flowNovedad.ts` | Captura de hora del incidente |
| `flowNovedadCodObjetivo` | `flowNovedad.ts` | Validación de código de objetivo |
| `flowNovedadTipo` | `flowNovedad.ts` | Selección de tipo de novedad |
| `flowNovedadDescrip` | `flowNovedad.ts` | Captura de descripción |
| `flowNovedadAccion` | `flowNovedad.ts` | Captura de acción realizada |
| `flowNovedadRecibirDocs` | `flowNovedad.ts` | Recepción de imágenes/videos adjuntos |
| `flowNovedadEnvio` | `flowNovedad.ts` | Confirmación y envío del reporte |
| `flowNovedadRouter` | `flowNovedad.ts` | Enrutamiento interno de sub-flujos |
| `flowNovedadPendiente` | `flowNovedad.ts` | Ver novedades pendientes |
| `flowConsNovedadPendiente` | `flowNovedad.ts` | Consulta individual de novedad pendiente |
| `flowProactivoNovedad` | `flowNovedad.ts` | Notificación proactiva de novedades |

### Finanzas

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowAdelanto` | `flowAdelanto.ts` | Consulta de estado de adelantos |
| `flowFormAdelanto` | `flowAdelanto.ts` | Formulario de solicitud de adelanto |

### Información

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowInformacionPersonal` | `flowInformacionPersonal.ts` | Datos personales del asociado |
| `flowInformacionEmpresa` | `flowInformacionEmpresa.ts` | Datos institucionales de la cooperativa |

### Otros

| Flujo | Archivo | Descripción |
|---|---|---|
| `flowIA` | `flowIA.ts` | Flujo experimental IA (NO activo en producción) |
| `flowLicencia` | `flowLicencia.ts` | Consulta de licencias |
| `flowConstMedica` | `flowConstMedica.ts` | Constancia médica |

## Registro de Flujos

En `bot-server.ts → BotServer.init()`:
```typescript
const adapterFlow = createFlow([
  flowLogin, flowMenu, flowValidateCode, flowRecibo, flowMonotributo,
  flowRemoveTel, idleFlow, flowInformacionPersonal, flowInformacionEmpresa,
  flowDescargaDocs, flowNovedad, flowNovedadCodObjetivo, flowNovedadTipo,
  flowNovedadDescrip, flowNovedadHora, flowNovedadFecha, flowNovedadEnvio,
  flowNovedadAccion, flowNovedadRouter, flowNovedadRecibirDocs,
  flowNovedadPendiente, flowConsNovedadPendiente, flowProactivoNovedad,
  flowSinRegistrar, flowAdelanto, flowFormAdelanto
])
```

## Relación con la Arquitectura Multi-Agente

Los flujos de producción y la arquitectura multi-agente IA cubren los **mismos dominios funcionales** pero son **completamente independientes**:

| Dominio | Flujo WhatsApp | Agente IA |
|---|---|---|
| Autenticación | `flowLogin` | `bot-orchestrator-agent` |
| Recibos | `flowRecibo` | `bot-docs-agent` |
| Monotributo | `flowMonotributo` | `bot-docs-agent` |
| Novedades | `flowNovedad` (13 sub-flujos) | `bot-novedades-agent` |
| Adelantos | `flowAdelanto` | `bot-finanzas-agent` |
| Info Personal | `flowInformacionPersonal` | `bot-info-agent` |
| Info Empresa | `flowInformacionEmpresa` | `bot-info-agent` |

> [!NOTE]
> No existe migración planificada de flujos duros a IA. Ambos sistemas coexisten y sirven a canales diferentes (WhatsApp real vs. Panel Admin).

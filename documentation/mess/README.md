# Módulo Mess — Documentación Técnica

> Servicio de mensajería y chatbot de **Cooperativa de Trabajo Lince Seguridad**.

## Índice

- [Visión General](#visión-general)
- [Arquitectura del Módulo](architecture.md)
- [API Endpoints — ChatBot](api-chatbot.md)
- [Sistema Multi-Agente IA](multi-agent-system.md)
- [Flujos WhatsApp (Producción)](whatsapp-flows.md)
- [Modelo de Datos](data-model.md)
- [Decisiones de Diseño (ADR)](decisions.md)

## Visión General

El módulo `mess/` es un servicio Node.js independiente que gestiona dos subsistemas de comunicación:

1. **Bot de WhatsApp (Producción)**: Bot real conectado a WhatsApp vía `@builderbot/bot` con flujos duros preprogramados. **No usa IA**. Soporta proveedores Baileys, Meta y Telegram.
2. **Chat de Prueba con IA (Panel Admin)**: Interfaz en el frontend Angular (`acceso-bot`) que conecta con Ollama (modelo `gpt-oss:120b`) usando una **arquitectura multi-agente**.

> [!IMPORTANT]
> **Separación estricta de entornos**: La IA SOLO se ejecuta desde el chat de prueba del frontend Angular. El bot de WhatsApp de producción NO usa IA bajo ninguna circunstancia. Esta decisión fue tomada explícitamente y está PROHIBIDO implementar flags o variables para activar IA en WhatsApp.

## Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | v20+ (con `--experimental-strip-types`) |
| Lenguaje | TypeScript | Nativo (sin transpilación, `--experimental-transform-types`) |
| HTTP Server | Express | v5.2.1 |
| ORM / DB | TypeORM + SQL Server | mssql v12.2 |
| Bot Framework | @builderbot/bot | v1.3.15 |
| Proveedores WhatsApp | Baileys, Meta, Telegram | v1.3.15 |
| IA Local | Ollama (SDK) | v0.6.3 |
| Procesamiento Imágenes | Sharp, Jimp | sharp v0.34, jimp v1.6 |
| PDF | pdfjs-dist | v5.6 |
| Criptografía | crypto-js | v4.2 |
| Scheduler | node-schedule | v2.1 |

## Estructura de Directorios

```
mess/
├── agents/                          # Prompts de sub-agentes IA (.md)
│   ├── bot-architecture.md          # Documentación de la arquitectura multi-agente
│   ├── bot-orchestrator-agent.md    # Agente orquestador (autenticación + enrutamiento)
│   ├── bot-novedades-agent.md       # Agente de novedades e incidentes
│   ├── bot-docs-agent.md            # Agente de documentos y recibos
│   ├── bot-finanzas-agent.md        # Agente de adelantos financieros
│   └── bot-info-agent.md            # Agente de consultas de información
├── src/
│   ├── index.ts                     # Entry point, inicialización de servicios
│   ├── server.ts                    # WebServer + DBServer
│   ├── bot-server.ts                # BotServer: gestión del bot WhatsApp + Ollama
│   ├── data-source.ts               # Configuración TypeORM
│   ├── controller/
│   │   ├── base.controller.ts       # Controller base (getURLDocumentoNew, etc.)
│   │   ├── chatbot.controller.ts    # Controller principal IA: chat(), reinicia(), routing
│   │   ├── personal.controller.ts   # Operaciones sobre Personal, teléfono, info
│   │   ├── documentos.controller.ts # Recibos y comprobantes AFIP
│   │   ├── novedad.controller.ts    # Novedades e incidentes
│   │   ├── objetivo.controller.ts   # Objetivos (sitios de trabajo)
│   │   ├── file-upload.controller.ts# Subida de archivos
│   │   ├── controller.module.ts     # Barrel: instancias exportadas
│   │   └── util.ts                  # Utilidades comunes
│   ├── flow/                        # Flujos duros de WhatsApp (@builderbot)
│   │   ├── flowLogin.ts             # Autenticación por teléfono + código
│   │   ├── flowMenu.ts              # Menú principal de opciones
│   │   ├── flowRecibo.ts            # Descarga de recibos de sueldo
│   │   ├── flowMonotributo.ts       # Descarga de comprobantes AFIP
│   │   ├── flowNovedad.ts           # Reporte completo de novedades (mayor complejidad)
│   │   ├── flowAdelanto.ts          # Solicitud de adelantos de sueldo
│   │   ├── flowDescargaDocs.ts      # Documentación pendiente
│   │   ├── flowInformacionPersonal.ts
│   │   ├── flowInformacionEmpresa.ts
│   │   ├── flowRemoveTel.ts         # Desvinculación de teléfono
│   │   ├── flowIA.ts                # (Experimental, no activo en producción)
│   │   ├── flowIdle.ts              # Timeout por inactividad
│   │   ├── flowLicencia.ts          # Consulta de licencias
│   │   └── flowConstMedica.ts       # Constancia médica
│   ├── routes/
│   │   ├── routes.module.ts         # Registro de todas las rutas
│   │   ├── chatBot.routes.ts        # Rutas del chatbot (/api/chatbot/*)
│   │   ├── personal.routes.ts       # Rutas de personal
│   │   └── documentos.routes.ts     # Rutas de documentos
│   ├── middlewares/                  # Middleware de autenticación
│   ├── sqlserver-database/           # Adaptador DB para @builderbot
│   └── info/                        # Información estática del sistema
├── .env                             # Variables de entorno (no versionado)
├── package.json
└── tsconfig.json
```

## Arranque del Servicio

```bash
# Desarrollo (Node nativo con TypeScript)
npm run dev
# Equivale a: node --experimental-strip-types --experimental-transform-types --watch ./src/index.ts

# Producción
npm run build && npm run prod
```

### Secuencia de Inicialización (`index.ts`)

1. `WebServer.init()` → Levanta Express en `SERVER_API_PORT`.
2. `makeRoutes()` → Registra rutas HTTP.
3. `DBServer.init()` → Conecta TypeORM a SQL Server (con retry: 5 intentos, 2s delay).
4. `BotServer.init()` → Conecta proveedor de WhatsApp, registra flujos, carga prompt/tools.
5. **Schedulers**: 
   - `0 7 * * *` → Reinicio diario del proceso.
   - `*/1 * * * *` → Procesamiento de cola de mensajes (`BotColaMensajes`), si `ENABLE_QUEUE_MSGS=true`.

## Variables de Entorno Principales

| Variable | Descripción |
|---|---|
| `SERVER_API_PORT` | Puerto del servidor Express |
| `PROVIDER` | Proveedor de WhatsApp: `BAILEY`, `META`, `TELEGRAM`, `DUMMY` |
| `PROVIDER_ID` | Identificador del proveedor |
| `OLLAMA_API_KEY` | API Key para Ollama |
| `PATH_DOCUMENTS` | Ruta a `back/docs/` (donde vive `ia-prompt.txt` y `ia-tools.json`) |
| `LINK_VIGENCIA` | Horas de vigencia del enlace de registro (default: 3) |
| `ENABLE_QUEUE_MSGS` | Habilitar procesamiento de cola de mensajes |
| `BOT_PORT` | Puerto del bot HTTP server (default: 3008) |

## Documentos Relacionados

- [Prompts de Agentes](../../mess/agents/) — Archivos `.md` con instrucciones para cada sub-agente.
- [ia-tools.json](../../back/docs/ia-tools.json) — Definición de herramientas disponibles para la IA.
- [ia-prompt.txt](../../back/docs/ia-prompt.txt) — Prompt monolítico original (legacy, reemplazado por la arquitectura multi-agente).

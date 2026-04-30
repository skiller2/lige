# Arquitectura del Módulo Mess

## Diagrama de Componentes

```mermaid
graph TB
    subgraph "Frontend Angular"
        AB["acceso-bot (Panel Admin)"]
    end

    subgraph "Módulo Mess (Node.js)"
        subgraph "Capa HTTP"
            WS["WebServer (Express v5)"]
            RT["Routes"]
        end
        
        subgraph "Controllers"
            CBC["ChatBotController"]
            PC["PersonalController"]
            DC["DocumentosController"]
            NC["NovedadController"]
            OC["ObjetivoController"]
            FUC["FileUploadController"]
        end

        subgraph "Bot WhatsApp"
            BS["BotServer"]
            FL["Flujos (@builderbot)"]
            PR["Proveedores (Baileys/Meta/Telegram)"]
        end

        subgraph "IA Multi-Agente"
            OL["Ollama Client"]
            AG["Agentes (.md)"]
            TL["Tools (ia-tools.json)"]
        end
    end

    subgraph "Infraestructura"
        DB["SQL Server (TypeORM)"]
        OLL["Ollama Server (gpt-oss:120b)"]
        WA["WhatsApp Cloud API / Baileys"]
    end

    AB -->|"POST /api/chatbot/chat"| WS
    WS --> RT --> CBC
    CBC --> PC
    CBC --> DC
    CBC --> NC
    CBC --> OC
    CBC -->|"chat()"| OL
    OL -->|"HTTP"| OLL
    CBC -->|"Lee prompts"| AG
    CBC -->|"Filtra tools"| TL

    BS --> FL
    FL --> PR
    PR --> WA
    BS --> PC
    BS --> DC

    PC --> DB
    DC --> DB
    NC --> DB
    OC --> DB
```

## Capas del Sistema

### 1. Capa HTTP (`server.ts`, `routes/`)
- **WebServer**: Instancia Express que escucha en `SERVER_API_PORT`.
- **Rutas**: Todas protegidas con `authMiddleware.verifyToken` + `authMiddleware.hasGroup(['gSistemas'])`.
- El middleware de autenticación valida tokens JWT emitidos por el backend principal (`back/`).

### 2. Capa de Controllers (`controller/`)

Cada controller extiende `BaseController` que provee:
- `jsonRes()`: Respuesta JSON estandarizada.
- `getURLDocumentoNew()`: Generación de URLs de descarga de documentos.
- Acceso a `pathDocuments` para lectura de archivos de configuración.

#### ChatBotController — El controller central de IA
Responsable de toda la lógica de interacción con Ollama. Ver detalle completo en [multi-agent-system.md](multi-agent-system.md).

#### PersonalController
Gestión de datos personales del asociado:
- `getPersonaState(chatId)` → Estado de autenticación por teléfono.
- `genTelCode(chatId)` → Generación de código de verificación.
- `removeCode(chatId)` → Eliminación de código tras verificación exitosa.
- `delTelefonoPersona(chatId)` → Desvinculación de teléfono.
- `getInfoPersonal(personalId, chatId)` → Datos personales completos.
- `getInfoEmpresa()` → Datos institucionales.
- `getDocsPendDescarga(personalId)` → Documentos pendientes.
- `getPersonalAdelanto()` / `setPersonalAdelanto()` / `deletePersonalAdelanto()` → CRUD de adelantos.

#### DocumentosController
Consulta de documentos para descarga:
- `getLastPeriodosOfComprobantesAFIP(personalId, cant)` → Últimos períodos de monotributo.
- `getLastPeriodoOfComprobantes(personalId, cant)` → Últimos recibos de sueldo.

#### NovedadController
Gestión completa de novedades/incidentes:
- `getBackupNovedad(personalId)` → Recuperar novedad en caché (reportes inconclusos).
- `saveNovedad(personalId, novedad)` → Guardado progresivo.
- `getNovedadTipo()` → Catálogo de tipos de novedad.
- `addNovedad(novedad, chatId, personalId)` → Confirmación y envío del reporte.
- `getNovedadesPendientesByResponsable(personalId)` → Listado de pendientes.
- `setNovedadVisualizacion(...)` → Marcar como vista.

#### ObjetivoController
- `getObjetivoByCodObjetivo(codObjetivo)` → Validación de código de objetivo.

### 3. Capa Bot WhatsApp (`bot-server.ts`, `flow/`)

`BotServer` es la clase principal que:
- Inicializa el proveedor de WhatsApp según `process.env.PROVIDER`.
- Registra todos los flujos de `@builderbot` en `init()`.
- Mantiene la instancia de Ollama y el prompt/tools en memoria.
- Gestiona la cola de mensajes y el envío proactivo.

#### Proveedores soportados
| Proveedor | Clase | Uso |
|---|---|---|
| `BAILEY` | `BaileysProvider` | WhatsApp Web (scraping) |
| `META` | `MetaProvider` | WhatsApp Cloud API oficial |
| `TELEGRAM` | `TelegramProvider` | Telegram Bot API |
| `DUMMY` | `null` | Sin proveedor (solo API HTTP) |

### 4. Capa de Datos (`data-source.ts`, `sqlserver-database/`)
- TypeORM conecta a SQL Server.
- `sqlserver-database/` contiene un adaptador personalizado de `@builderbot` para persistir sesiones del bot en SQL Server (en lugar de MemoryDB).

## Flujo de Datos — Chat de Prueba (IA)

```mermaid
sequenceDiagram
    participant U as Usuario (Angular)
    participant API as Express API
    participant CBC as ChatBotController
    participant OL as Ollama
    participant DB as SQL Server

    U->>API: POST /api/chatbot/chat {chatId, message}
    API->>CBC: chat(req, res, next)
    CBC->>CBC: Determinar agente activo (orchestrator por defecto)
    CBC->>CBC: Inyectar system prompt del agente
    CBC->>OL: ollama.chat({model, messages, tools})
    OL-->>CBC: responseIA

    alt Respuesta con "Derivar a [dominio]"
        CBC->>CBC: Cambiar agente activo
        CBC->>CBC: Actualizar system prompt
        CBC->>OL: ollama.chat() (recall automático)
        OL-->>CBC: responseIA del nuevo agente
    end

    alt Respuesta con tool_calls
        loop Para cada tool_call
            CBC->>DB: Ejecutar operación (vía controllers)
            DB-->>CBC: Resultado
            CBC->>CBC: Push resultado como role:"tool"
        end
        CBC->>OL: ollama.chat() (recall con resultados)
        OL-->>CBC: Respuesta final
    end

    CBC-->>API: {response: messages[]}
    API-->>U: JSON con historial nuevo
```

## Flujo de Datos — Bot WhatsApp (Producción)

```mermaid
sequenceDiagram
    participant WA as WhatsApp
    participant PR as Proveedor (Baileys/Meta)
    participant BB as @builderbot
    participant FL as Flujos (flow*.ts)
    participant DB as SQL Server

    WA->>PR: Mensaje entrante
    PR->>BB: Evento "message"
    BB->>FL: Match por keyword/regex
    FL->>DB: Consulta/operación
    DB-->>FL: Datos
    FL->>BB: flowDynamic([{body: respuesta}])
    BB->>PR: Enviar respuesta
    PR->>WA: Mensaje saliente
```

# Modelo de Datos — Módulo Mess

## Tablas SQL Server

### `BotLog`
Persistencia de todos los mensajes de conversación del bot.

| Columna | Tipo | Descripción |
|---|---|---|
| `Stm` | datetime | Timestamp del mensaje |
| `Ref` | varchar | Referencia del mensaje |
| `Keyword` | varchar | Keyword que activó el flujo |
| `Answer` | varchar | Respuesta del bot |
| `RefSerialize` | text | Datos serializados |
| `FromMsg` | varchar | Origen del mensaje |
| `Options` | varchar | Opciones presentadas |
| `Proveedor` | varchar | Proveedor (BAILEY, META, etc.) |
| `Telefono` | varchar | Teléfono del usuario |

### `BotRegTelefonoPersonal`
Relación teléfono ↔ PersonalId. Tabla de autenticación del bot.

| Columna | Tipo | Descripción |
|---|---|---|
| `PersonalId` | int | FK a Personal |
| `Telefono` | varchar | Número (formato internacional) |
| `Codigo` | varchar | Código de verificación (null = verificado) |
| `JsonNovedad` | text | Cache JSON de novedad en progreso |

### `BotColaMensajes`
Cola de mensajes salientes proactivos.

| Columna | Tipo | Descripción |
|---|---|---|
| `FechaIngreso` | datetime | Ingreso a la cola |
| `PersonalId` | int | FK a Personal |
| `ClaseMensaje` | varchar | Tipo (ej: `NOVEDAD`) |
| `TextoMensaje` | text | Contenido a enviar |
| `FechaProceso` | datetime | Fecha envío (null = pendiente) |
| `SentMethod` | varchar | Método de envío |
| `SentProvider` | varchar | Proveedor que procesó |

### `DocumentoDescargaLog`
Log de descargas de documentos por el bot.

| Columna | Tipo | Descripción |
|---|---|---|
| `DocumentoId` | int | FK a Documento |
| `FechaDescarga` | datetime | Fecha de descarga |
| `Telefono` | varchar | Teléfono solicitante |
| `PersonalId` | int | FK a Personal |

## Memoria Volátil (Runtime)

### `botServer.chatmess[chatId]`
Array de mensajes en memoria por sesión de chat de prueba.

```typescript
interface ChatMessage {
  id: number;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  sendIt?: boolean;     // true = ya enviado al frontend
  tool_calls?: ToolCall[];
  thinking?: string;
  tool_name?: string;   // Solo para role:"tool"
}
```

### `ChatBotController.activeAgents`
```typescript
static activeAgents = new Map<string, string>();
// chatId → "orchestrator" | "novedades" | "docs" | "finanzas" | "info"
```

> [!WARNING]
> La memoria es 100% volátil. Si el proceso Node se reinicia, se pierden todas las sesiones activas. La persistencia está en `BotLog`.

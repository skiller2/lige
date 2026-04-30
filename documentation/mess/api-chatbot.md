# API Endpoints — ChatBot

Todos los endpoints están bajo el prefijo `/api/chatbot/` y requieren autenticación JWT + pertenencia al grupo `gSistemas`.

Archivo de rutas: [`mess/src/routes/chatBot.routes.ts`](../../mess/src/routes/chatBot.routes.ts)

## Endpoints

### `POST /api/chatbot/chat`

**Propósito**: Enviar un mensaje al chatbot IA y recibir la respuesta completa.

**Body**:
```json
{
  "chatId": "string — Identificador único de la sesión de chat",
  "message": "string — Mensaje del usuario"
}
```

**Respuesta**:
```json
{
  "data": {
    "response": [
      {
        "id": 1,
        "content": "Texto de respuesta",
        "role": "assistant | user | tool",
        "tool_calls": [],
        "thinking": "string | null"
      }
    ]
  },
  "msg": "ok"
}
```

**Comportamiento interno**:
1. Si `message` está vacío, retorna array vacío sin procesar.
2. Si es el primer mensaje, inicializa la sesión con el system prompt del orquestador.
3. Ejecuta el loop de recall (tool_calls + routing de agentes) hasta obtener una respuesta final.
4. Solo retorna mensajes nuevos (los que no fueron enviados previamente — campo `sendIt`).

**Archivo**: [`chatbot.controller.ts` → `chat()`](../../mess/src/controller/chatbot.controller.ts)

---

### `POST /api/chatbot/reinicia`

**Propósito**: Reiniciar la sesión de chat, limpiando historial y agente activo.

**Body**:
```json
{
  "chatId": "string"
}
```

**Comportamiento**:
- Limpia `botServer.chatmess[chatId]` (historial).
- Elimina la entrada de `ChatBotController.activeAgents` (vuelve al orquestador).

---

### `GET /api/chatbot/iaprompt`

**Propósito**: Obtener el prompt monolítico actual (legacy).

**Respuesta**:
```json
{
  "data": {
    "iaPrompt": "string — Contenido del prompt",
    "iaPromptHash": "string — SHA-256 hex"
  }
}
```

---

### `POST /api/chatbot/iaprompt`

**Propósito**: Actualizar el prompt monolítico en disco y memoria.

**Body**:
```json
{
  "iaPrompt": "string — Nuevo contenido",
  "iaPromptHash": "string — Hash de la versión leída (control de concurrencia)"
}
```

**Comportamiento**:
- Valida que el hash coincida con la versión actual (optimistic locking).
- Escribe en `{PATH_DOCUMENTS}/ia-prompt.txt`.
- Limpia todas las sesiones de chat activas.

---

### `GET /api/chatbot/iatools`

**Propósito**: Obtener la definición de herramientas IA (JSON).

---

### `POST /api/chatbot/iatools`

**Propósito**: Actualizar las herramientas IA.

**Comportamiento**: Similar a `POST /iaprompt` — valida hash, escribe `ia-tools.json`, limpia sesiones.

---

### `GET /api/chatbot/qr/:imgcount?`

**Propósito**: Obtener la imagen QR de vinculación del bot WhatsApp.

**Respuesta**: Imagen PNG binaria (`bot.qr.png`).

---

### `GET /api/chatbot/status`

**Propósito**: Estado del bot WhatsApp (`ONLINE`, `REQ_ACTION`, `AUTH_FAIL`).

---

### `GET /api/chatbot/delay` / `POST /api/chatbot/delay`

**Propósito**: Consultar/configurar el delay de respuesta del bot (ms).

---

### `POST /api/chatbot/sendAlert`

**Propósito**: Enviar una alerta por WhatsApp (requiere `apiKey`).

---

### `POST /api/chatbot/gotoFlow`

**Propósito**: Forzar la ejecución de un flujo específico para un número de teléfono.

**Body**:
```json
{
  "telefono": "string",
  "flow": "string — Nombre del flujo"
}
```

> [!NOTE]
> Este endpoint NO requiere autenticación JWT (es invocado por sistemas internos).

# Sistema Multi-Agente IA — Documentación Técnica

## 1. Motivación y Problema Original

### Estado previo (Prompt Monolítico)
- Un único prompt (`back/docs/ia-prompt.txt`, ~295 líneas inline en `bot-server.ts`) contenía TODAS las instrucciones: autenticación, menú, flujos de novedades, recibos, adelantos, información.
- Las 21 herramientas de `ia-tools.json` se enviaban completas en cada llamada a Ollama.
- **Problemas detectados**:
  - **Alucinaciones**: El modelo confundía herramientas entre dominios (ej: llamar `setPersonalAdelanto` cuando el usuario pedía un recibo).
  - **Lentitud**: Prompts largos + muchas tools = mayor tiempo de inferencia.
  - **Mantenimiento difícil**: Cualquier cambio requería editar un archivo masivo con riesgo de efectos colaterales.

### Solución: Arquitectura Multi-Agente
Separar la lógica en un **Orquestador** + **Sub-Agentes Especializados**, donde cada agente:
- Tiene su propio prompt (archivo `.md` en `mess/agents/`).
- Solo recibe las herramientas que le corresponden.
- Resuelve exclusivamente tareas de su dominio.

## 2. Agentes Definidos

### Orquestador (`bot-orchestrator-agent.md`)

| Propiedad | Valor |
|---|---|
| **Archivo** | `mess/agents/bot-orchestrator-agent.md` |
| **Rol** | Autenticación + enrutamiento de intención |
| **Tools** | `getPersonaState`, `genTelCode`, `removeCode`, `delTelefonoPersona` |
| **Resuelve tareas?** | ❌ Nunca. Solo autentica y deriva. |

**Flujo de autenticación**:
1. Llama a `getPersonaState` automáticamente al recibir el primer mensaje.
2. Según el estado del usuario: registra, valida código, o saluda.
3. Pregunta qué trámite necesita y emite una cadena de derivación.

**Cadenas de derivación** (case-insensitive):
- `"Derivar a docs"` → Agente de documentos
- `"Derivar a novedades"` → Agente de novedades
- `"Derivar a finanzas"` → Agente de finanzas
- `"Derivar a info"` → Agente de información

### Agente de Novedades (`bot-novedades-agent.md`)

| Propiedad | Valor |
|---|---|
| **Archivo** | `mess/agents/bot-novedades-agent.md` |
| **Rol** | Reportar incidentes y consultar novedades pendientes |
| **Tools (7)** | `getBackupNovedad`, `saveNovedad`, `getObjetivoByCodObjetivo`, `getNovedadTipo`, `addNovedad`, `getNovedadesPendientesByResponsable`, `setNovedadVisualizacion` |

**Flujos soportados**:
- **Informar novedad**: Flujo guiado paso a paso (backup → datos → validación de objetivo → tipo → resumen → confirmación → envío).
- **Ver novedades pendientes**: Listado paginado (máx 10 por mensaje) con marcado de visualización.

### Agente de Documentos (`bot-docs-agent.md`)

| Propiedad | Valor |
|---|---|
| **Archivo** | `mess/agents/bot-docs-agent.md` |
| **Rol** | Descargas de recibos, comprobantes AFIP y documentación pendiente |
| **Tools (4)** | `getLastPeriodosOfComprobantesAFIP`, `getLastPeriodoOfComprobantes`, `getDocsPendDescarga`, `getURLDocumentoNew` |

**Flujos soportados**:
- **Monotributo**: Listar períodos → seleccionar → confirmar → URL de descarga.
- **Recibo de retiro**: Listar períodos → seleccionar → confirmar → URL de descarga.
- **Documentación pendiente**: Listar pendientes → ofrecer descarga.

### Agente de Finanzas (`bot-finanzas-agent.md`)

| Propiedad | Valor |
|---|---|
| **Archivo** | `mess/agents/bot-finanzas-agent.md` |
| **Rol** | Solicitud y gestión de adelantos de sueldo |
| **Tools (4)** | `getAdelantoLimits`, `getPersonalAdelanto`, `deletePersonalAdelanto`, `setPersonalAdelanto` |

**Flujos soportados**:
- Consultar límites y estado actual → solicitar monto → confirmar → guardar.
- Cancelar adelanto vigente (doble confirmación).

### Agente de Información (`bot-info-agent.md`)

| Propiedad | Valor |
|---|---|
| **Archivo** | `mess/agents/bot-info-agent.md` |
| **Rol** | Consultas de solo lectura de datos personales e institucionales |
| **Tools (2)** | `getInfoPersonal`, `getInfoEmpresa` |

**Flujos soportados**:
- Datos personales: nombre, responsable, categoría, situación.
- Datos cooperativa: razón social, CUIT, dirección, autoridades.
- Si pide modificar datos → redirigir a responsable.

## 3. Implementación en Código

### Archivo principal: `chatbot.controller.ts`

#### Mapa de configuración de agentes
```typescript
static agentConfigs: { [key: string]: { file: string, tools: string[] } } = {
  "orchestrator": {
    file: "bot-orchestrator-agent.md",
    tools: ["getPersonaState", "genTelCode", "removeCode", "delTelefonoPersona"]
  },
  "novedades": { ... },
  "docs": { ... },
  "finanzas": { ... },
  "info": { ... }
};
```

#### Estado por sesión
```typescript
static activeAgents = new Map<string, string>();
// Clave: chatId → Valor: nombre del agente activo ("orchestrator", "novedades", etc.)
```

#### Métodos clave

| Método | Responsabilidad |
|---|---|
| `getAgentPrompt(agentName)` | Lee el `.md` del agente desde `mess/agents/`. Fallback al prompt default de BotServer. |
| `getAgentTools(agentName, allTools)` | Filtra `ia-tools.json` para devolver solo las herramientas del agente activo. |
| `chat(req, res, next)` | Loop principal: envía a Ollama → detecta derivación → ejecuta tools → recall. |
| `reinicia(req, res, next)` | Limpia historial y agente activo para un `chatId`. |

### Flujo del loop `chat()` — Pseudocódigo

```
1. Si es primer mensaje → push system prompt del orquestador
2. Push mensaje del usuario
3. DO:
   a. Enviar a Ollama con prompt + tools del agente activo
   b. Push respuesta al historial
   c. SI agente = "orchestrator" Y respuesta contiene "derivar a [X]":
      - Eliminar mensaje de routing del historial
      - Cambiar system prompt al nuevo agente
      - Actualizar activeAgents[chatId]
      - recall = true (vuelve al paso 3a)
   d. SI respuesta tiene tool_calls:
      - Ejecutar cada tool vía switch/case
      - Push resultado como role:"tool"
      - recall = true
   e. SINO: recall = false (sale del loop)
4. Retornar solo mensajes nuevos (sendIt = false)
```

## 4. Gestión de Memoria y Estado

### Memoria Volátil (en proceso Node)
```typescript
// Historial de mensajes por sesión
botServer.chatmess[chatId]: Message[]
// Cada mensaje: { id, role, content, sendIt?, tool_calls?, thinking? }

// Agente activo por sesión
ChatBotController.activeAgents: Map<string, string>
```

> [!WARNING]
> La memoria es 100% volátil. Si el proceso Node se reinicia, se pierden todas las sesiones activas. Esto es aceptable para el chat de prueba. La persistencia real está en `BotLog` (SQL Server).

### Persistencia (SQL Server)
- **`BotLog`**: Registro de todos los mensajes para auditoría.
  - Columnas: `Stm`, `Ref`, `Keyword`, `Answer`, `RefSerialize`, `FromMsg`, `Options`, `Proveedor`, `Telefono`.
- **`BotRegTelefonoPersonal`**: Relación teléfono ↔ PersonalId.
  - Columnas clave: `PersonalId`, `Telefono`, `Codigo`, `JsonNovedad`.

### Inyección de Contexto
- El `PersonalId` se obtiene a partir del teléfono del usuario al inicio de la conversación.
- Se inyecta internamente por el sistema en las llamadas a tools.
- **El usuario NUNCA debe proveer su propio ID** — el sistema lo resuelve automáticamente.

## 5. Agregar un Nuevo Agente — Guía

Para agregar un nuevo dominio de funcionalidad:

1. **Crear el prompt** en `mess/agents/bot-<dominio>-agent.md`:
   - Seguir la estructura estándar: Identidad, Confidencialidad, Flujos.
   - Usar español rioplatense, formato WhatsApp.

2. **Registrar en `agentConfigs`** en `chatbot.controller.ts`:
   ```typescript
   "<dominio>": {
     file: "bot-<dominio>-agent.md",
     tools: ["tool1", "tool2"]
   }
   ```

3. **Agregar cadena de derivación** en el prompt del orquestador:
   ```
   - Si quiere [descripción]: "Derivar a <dominio>".
   ```

4. **Agregar detección en `chat()`**:
   ```typescript
   else if (content.includes("derivar a <dominio>")) newAgent = "<dominio>";
   ```

5. **Implementar las tools** en el switch/case de `chat()` si son nuevas.

6. **Definir las herramientas** en `ia-tools.json` con el formato estándar de OpenAI function calling.

## 6. Reglas Críticas

> [!CAUTION]
> 1. **La IA SOLO se usa desde el chat de prueba del frontend Angular.** Jamás desde WhatsApp.
> 2. **Está PROHIBIDO** crear un flag, variable de entorno o mecanismo que active IA en el bot de WhatsApp real.
> 3. Los nombres de herramientas, endpoints y procesos internos son **confidenciales** — los agentes nunca deben revelarlos al usuario.
> 4. El orquestador **NUNCA resuelve tareas**. Solo autentica y deriva.
> 5. Cada agente **solo tiene acceso a sus propias tools**. No hay herramientas compartidas entre sub-agentes (excepto las del orquestador para autenticación).

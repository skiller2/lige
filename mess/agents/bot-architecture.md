# Arquitectura de Agentes del Chatbot IA

> Referencia rápida para uso interno de los agentes. Documentación técnica completa en [`documentation/mess/`](../../documentation/mess/).

## 1. Visión General
El Chatbot opera bajo una arquitectura multi-agente diseñada para reducir alucinaciones, optimizar el uso de tokens y hacer que el mantenimiento sea escalable. 

El modelo local (Ollama, `gpt-oss:120b`) no recibe un "super prompt" con todas las reglas y herramientas a la vez. En su lugar, el flujo se divide en un **Orquestador** (que autentica y decide) y **Sub-Agentes Especializados** (que resuelven tareas).

> **REGLA CRÍTICA**: La IA SOLO se ejecuta desde el chat de prueba del frontend Angular. El bot de WhatsApp de producción NO usa IA.

## 2. Flujo de la Conversación

1. **Recepción del Mensaje**: El usuario envía un mensaje desde el panel de administración. El sistema identifica su `chatId`.
2. **Evaluación de Intención (Orquestador)**: 
   - Si es el primer mensaje, interviene el `bot-orchestrator-agent`.
   - El orquestador autentica al usuario y evalúa a qué dominio pertenece su intención.
3. **Delegación a Sub-Agente**:
   - El orquestador emite una cadena `"Derivar a [dominio]"`.
   - El backend intercepta esta cadena, la elimina del historial, cambia el system prompt y las tools al sub-agente.
   - Se hace un `recall` automático a Ollama para que el nuevo agente responda directamente.
4. **Ejecución y Respuesta**:
   - El sub-agente usa sus tools para interactuar con la base de datos.
   - Las respuestas se devuelven al frontend.

## 3. Listado de Agentes y Skills Asignadas

### 1. `bot-orchestrator-agent`
- **Rol**: Autenticar y enrutar. No resuelve nada por sí mismo.
- **Herramientas (4)**: `getPersonaState`, `genTelCode`, `removeCode`, `delTelefonoPersona`.

### 2. `bot-novedades-agent`
- **Rol**: Reporte de incidentes y consulta de novedades pendientes.
- **Herramientas (7)**: `getBackupNovedad`, `saveNovedad`, `getObjetivoByCodObjetivo`, `getNovedadTipo`, `addNovedad`, `getNovedadesPendientesByResponsable`, `setNovedadVisualizacion`.

### 3. `bot-docs-agent`
- **Rol**: Recibos de sueldo, comprobantes AFIP y documentación pendiente.
- **Herramientas (4)**: `getLastPeriodosOfComprobantesAFIP`, `getLastPeriodoOfComprobantes`, `getDocsPendDescarga`, `getURLDocumentoNew`.

### 4. `bot-finanzas-agent`
- **Rol**: Solicitud y consulta de adelantos de sueldo.
- **Herramientas (4)**: `getAdelantoLimits`, `getPersonalAdelanto`, `deletePersonalAdelanto`, `setPersonalAdelanto`.

### 5. `bot-info-agent`
- **Rol**: Información personal e institucional de solo lectura.
- **Herramientas (2)**: `getInfoPersonal`, `getInfoEmpresa`.

## 4. Gestión de Memoria y Estado
- **Memoria de Sesión**: `botServer.chatmess[chatId]` — volátil, en memoria del proceso Node.
- **Agente Activo**: `ChatBotController.activeAgents` — Map que guarda qué agente atiende cada `chatId`.
- **Persistencia**: Todos los mensajes se registran en `BotLog` (SQL Server).
- **Inyección de Contexto**: El `PersonalId` se obtiene del teléfono al inicio. **El usuario nunca provee su propio ID**.

## 5. Cómo Agregar un Nuevo Agente
1. Crear `mess/agents/bot-<dominio>-agent.md`.
2. Agregar entrada en `ChatBotController.agentConfigs`.
3. Agregar cadena de derivación en el prompt del orquestador.
4. Agregar detección `content.includes("derivar a <dominio>")` en `chat()`.
5. Implementar las tools nuevas en el switch/case de `chat()`.

## 6. Documentación Completa
Ver la documentación técnica detallada en:
- [Arquitectura del Módulo](../../documentation/mess/architecture.md)
- [Sistema Multi-Agente](../../documentation/mess/multi-agent-system.md)
- [API Endpoints](../../documentation/mess/api-chatbot.md)
- [Decisiones de Diseño](../../documentation/mess/decisions.md)

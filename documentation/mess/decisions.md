# Decisiones de Diseño (ADR) — Módulo Mess / Chatbot IA

## ADR-001: Arquitectura Multi-Agente vs Prompt Monolítico

**Fecha**: 2026-04-30  
**Estado**: Aceptada  

### Contexto
El chatbot usaba un prompt monolítico (~295 líneas) con las 21 herramientas enviadas en cada llamada a Ollama. Esto causaba:
- Alucinaciones frecuentes (confusión entre herramientas de distintos dominios).
- Lentitud de inferencia (prompt largo + muchas tools).
- Dificultad de mantenimiento.

### Decisión
Migrar a una arquitectura de **Orquestador + Sub-Agentes Especializados**:
- Cada agente tiene su propio prompt (`.md`) y subset de tools.
- El orquestador autentica y enruta; nunca resuelve tareas.
- Los prompts viven en `mess/agents/` como archivos Markdown.

### Consecuencias
- ✅ Reducción de alucinaciones (cada agente solo ve sus tools).
- ✅ Inferencia más rápida (prompts cortos).
- ✅ Escalabilidad (nuevo dominio = nuevo `.md` + config).
- ⚠️ Complejidad adicional en el routing de `chat()`.
- ⚠️ Dependencia del modelo para interpretar cadenas de derivación.

---

## ADR-002: Separación Estricta IA / WhatsApp

**Fecha**: 2026-04-30  
**Estado**: Aceptada (PROHIBIDO cambiar)  

### Contexto
Existía la posibilidad de activar IA en el bot de WhatsApp real con un flag de entorno.

### Decisión
**La IA SOLO se ejecuta desde el chat de prueba del frontend Angular.** El bot de WhatsApp de producción usa exclusivamente flujos duros de `@builderbot`. NO se implementará ningún flag o variable para activar IA en WhatsApp.

### Justificación
- El modelo IA (Ollama) no está suficientemente validado para producción.
- Los flujos duros son determinísticos y predecibles.
- Un error de la IA en producción afectaría a asociados reales.

---

## ADR-003: Ubicación de Agentes en `mess/agents/`

**Fecha**: 2026-04-30  
**Estado**: Aceptada  

### Decisión
Los prompts de agentes del chatbot se ubican en `mess/agents/` (dentro del módulo `mess`, al nivel de `src/`), no en `agents/` (raíz del monorepo) ni en `back/docs/`.

### Justificación
- `mess/` es donde vive toda la lógica del bot y el chatbot.
- Los agentes de `agents/` (raíz) son agentes de desarrollo de Gemini (doc-agent, tkt-agent, etc.), conceptualmente distintos.
- Mantener proximidad con el código que los consume (`chatbot.controller.ts`).

---

## ADR-004: Derivación por Cadena de Texto

**Fecha**: 2026-04-30  
**Estado**: Aceptada  

### Contexto
Se necesitaba un mecanismo para que el orquestador indique a qué sub-agente derivar.

### Decisión
El orquestador emite una cadena como `"Derivar a finanzas"` en su respuesta. El backend la detecta con `content.includes()`, elimina ese mensaje del historial (el usuario no lo ve), y hace un recall al nuevo agente.

### Alternativas descartadas
- Tool call especial de routing → Más complejo, requiere tool adicional.
- JSON estructurado → El modelo podría fallar en generar JSON válido.

### Consecuencias
- ✅ Simple de implementar y depurar.
- ⚠️ Sensible al wording exacto del modelo. Si Ollama no usa la cadena exacta, la derivación falla.
- 📋 **Pendiente**: Validar si el modelo (`gpt-oss:120b`) interpreta correctamente las cadenas de derivación.

---

## ADR-005: Prompt Monolítico como Fallback

**Fecha**: 2026-04-30  
**Estado**: Vigente  

### Decisión
El prompt monolítico original se mantiene en `bot-server.ts` como valor por defecto del campo `iaPrompt`. Si falla la lectura del archivo `.md` de un agente, el sistema cae al prompt monolítico como fallback.

### Consecuencias
- ✅ Resiliencia ante errores de lectura de archivos.
- ⚠️ El fallback no tiene la optimización multi-agente.

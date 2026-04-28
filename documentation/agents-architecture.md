# Arquitectura del Ecosistema de Agentes de IA

Este proyecto automatiza tareas de análisis, refactorización, documentación y generación de tickets utilizando agentes de IA. La configuración de estos agentes reside en la carpeta `agents/` y sus conocimientos encapsulados en `agents/skills/`.

## Agentes Activos

| Agente | Archivo | Rol Principal |
|--------|---------|---------------|
| **Meta-Agent** | `meta-agent.md` | Mantiene y mejora a los demás agentes. Aplica "Interrogación Proactiva" antes de cambiar archivos y estandariza la redacción. |
| **Ticket Agent** | `tkt-agent.md` | Transforma pedidos ambiguos en tickets estructurados (formato Redmine) exigiendo ubicaciones exactas de código y criterios de aceptación claros. |
| **Documentador** | `doc-agent.md` | Analiza código para generar documentación de arquitectura, mapas de ramas e índices en la carpeta `documentation/`. |
| **QA Refactor** | `qa-refactor-agent.md` | Analiza calidad, propone mejoras de código y verifica estándares del proyecto. |

## Skills (Bases de Conocimiento)

Las *skills* son archivos `.skill.md` que los agentes consultan como fuente de verdad. El `meta-agent` se encarga de actualizarlas para evitar que el equipo humano deba hacerlo manualmente repetidas veces.

1. **`stack-context.skill.md`**: Mapeo real de la arquitectura del proyecto. Contiene controladores (ej. `procesos-automaticos.controller.ts`), rutas de UI, y nomenclatura de tablas de Base de Datos (ej. `Evento`, `EventoEstado`).
2. **`prompt-engineering.skill.md`**: Manual de estilo para darle instrucciones a los agentes (usar voz imperativa, evitar negatividades difusas y forzar estructuras de salida).
3. **`knowledge-extraction.skill.md`**: Reglas para que el sistema aprenda de las correcciones del usuario y extraiga patrones universales hacia las bases de conocimiento.
4. **`acceptance-criteria.skill.md`**: Estándar para escribir criterios testeables. Incluye directivas como especificar siempre operadores exactos (`>=`, `<=`) en vez de rangos difusos.
5. **`redmine-format.skill.md`**: Plantilla de salida para copiar y pegar directo en el gestor de tareas.

## Flujo de Mejora Continua (Ciclo de Vida)

1. **Ejecución Operativa**: El usuario delega una tarea a un agente (`tkt-agent`, `doc-agent`).
2. **Corrección Manual**: El usuario detecta que falta información o corrige un patrón (ej. cambiar nombre de tabla o pedir rutas exactas).
3. **Invocación del Meta-Agent**: El usuario llama al `meta-agent` para revisar esa corrección.
4. **Extracción y Aprendizaje**: El `meta-agent` extrae la convención nueva, actualiza la *skill* correspondiente (ej. `stack-context`) y modifica el prompt del agente original si hace falta.
5. **Iteración Optimizada**: En la próxima ejecución, el agente resuelve la tarea con mayor precisión sin intervención humana.

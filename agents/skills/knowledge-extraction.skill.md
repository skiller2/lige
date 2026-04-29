---
name: knowledge-extraction
description: Procedimientos para destilar conversaciones, correcciones y código en reglas abstractas, convenciones o tablas de conocimiento para los archivos `.skill.md`.
---

# Skill: knowledge-extraction

## Propósito
Extraer el conocimiento persistente (arquitectura, reglas de negocio, convenciones técnicas) a partir del ruido de una conversación cotidiana o un requerimiento específico.

## Identificación de Conocimiento

### ¿Qué DEBE ser extraído?
1. **Nuevos componentes o entidades de dominio:** "Acabamos de crear el módulo de reportes." -> Va a `stack-context.skill.md`.
2. **Convenciones o Patrones:** "De ahora en más los endpoints de borrado usarán método PATCH con campo activo=false." -> Va a reglas de Backend.
3. **Diccionario de equivalencias:** "La tabla en BD se llama `Evento`, pero el modelo en Angular se llama `ProcesoAutomatico`." -> Va a `stack-context.skill.md`.
4. **Errores recurrentes:** "El agente siempre genera botones sin la clase ant-btn." -> Genera una regla de calidad en el agente o skill frontend.

### ¿Qué NO DEBE ser extraído?
1. **Tareas de un solo uso:** "Cambiamos el color de este botón específico a rojo." (Es parte de una feature temporal, no de la arquitectura global).
2. **Implementaciones ultra-específicas:** Lógica de negocio aislada que no es aplicable como patrón a otros lugares.
3. **Discusiones de debugging:** Trazas de errores o intentos fallidos que ya fueron resueltos.

## Proceso de Destilación

1. **Analizar la charla:** Identificar el cambio de fondo que originó la corrección del usuario.
2. **Abstraer (Generalizar la regla):** Quitar los detalles particulares para dejar el patrón universal.
   - *Caso Original:* "El agente de tickets me puso `>=` en vez de `>` para la fecha del mes en este requerimiento."
   - *Abstracción Extraída:* "Regla: Al generar filtros de fechas o valores, definir explícitamente el operador de límite (`>=` o `<=`) para evitar ambigüedades."
3. **Clasificar y Ubicar:** 
   - ¿Es sobre la estructura del proyecto? -> `stack-context.skill.md`
   - ¿Es sobre redacción funcional? -> `acceptance-criteria.skill.md`
   - ¿Es sobre un agente específico? -> Actualizar el `.md` del agente.
4. **Formatear e Insertar:** Redactar la actualización respetando el formato existente del archivo destino (ej. agregar una fila a una tabla Markdown, o un ítem a una lista de reglas).

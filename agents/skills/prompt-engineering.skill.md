---
name: prompt-engineering
description: Mejores prácticas y reglas para la confección de prompts de agentes. Usar al redactar reglas de comportamiento para garantizar que los LLMs obedezcan estrictamente.
---

# Skill: prompt-engineering

## Propósito
Guiar la creación de instrucciones efectivas, deterministas y sin ambigüedades para los agentes de IA del ecosistema.

## Reglas de Redacción de Prompts

### 1. Voz Activa e Imperativa
- **INCORRECTO:** "El agente debería intentar no usar palabras largas."
- **CORRECTO:** "Usa únicamente palabras de menos de 3 sílabas." "Genera una lista." "Pregunta al usuario."

### 2. Evitar Restricciones Negativas Difusas
Los modelos de IA procesan mejor las instrucciones positivas. Indicar qué hacer es mejor que indicar qué evitar.
- **INCORRECTO:** "No seas vago en tus descripciones."
- **CORRECTO:** "Usa métricas observables y verbos de acción en cada descripción."
- *Excepción:* Si la restricción es de seguridad absoluta o para corregir una alucinación común, usar mayúsculas: "NUNCA inventes nombres de variables. Si no lo sabes, marca [A DEFINIR]."

### 3. Delimitación de Contexto
- Usar marcadores visuales para separar la instrucción de los datos (variables).
- Recomendar el uso de bloques de código Markdown o viñetas para estructurar la información dentro del prompt.

### 4. Definir Entradas y Salidas Exactas
- Si se espera que el agente actúe sobre un código, especificar qué información debe solicitar si falta (ej: "Si falta la ruta del archivo, pregunta al usuario antes de proceder").
- Si el output debe ser importado a otro sistema, forzar la salida dentro de un bloque `` ```text `` o `` ```markdown `` para facilitar el copiado limpio sin renderizado del markdown.

### 5. Asignación de un Rol Claro
- Todo agente debe tener un contexto de persona. Ej: "Eres un analista técnico especializado en refactorización." Esto ajusta el tono, vocabulario y espacio de probabilidad del modelo.

## Check-list para validar un Agente
- [ ] ¿Tiene un objetivo claro en una sola oración?
- [ ] ¿Están listados los pasos obligatorios (1, 2, 3...) que debe seguir secuencialmente?
- [ ] ¿Se definió cómo debe actuar si la información del usuario está incompleta? (Mecanismo de Fall-back).
- [ ] ¿La salida esperada tiene un formato exacto y consistente exigido?

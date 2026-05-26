# Agents en Codex

Esta carpeta contiene perfiles de trabajo en Markdown para orientar conversaciones, pero Codex no los carga automaticamente por estar en `agents/`.

## Como se usan
- Para activar uno, el usuario debe pedirlo explicitamente, por ejemplo: `toma el control de agents/qa-refactor-agent.md`.
- Codex debe leer el archivo solicitado y aplicar sus reglas mientras dure ese pedido.
- Si el usuario pide dejar de usar un agente, Codex vuelve al comportamiento general de la sesion.

## Limitaciones importantes
- El frontmatter (`name`, `description`, `model`, `skills`) documenta intencion, pero no registra un agente ejecutable por si solo.
- Las entradas en `skills:` apuntan a archivos del repo, pero no equivalen automaticamente a Skills nativas de Codex.
- Las reglas que contradigan instrucciones superiores de Codex o del entorno pueden no aplicarse.

## Recomendaciones para nuevos agentes
- Escribir reglas operativas y concretas, no solo una descripcion de personalidad.
- Explicar cuando debe usarse y cuando debe desactivarse.
- Evitar instrucciones absolutas de formato, como exigir una firma en toda respuesta, si el agente se va a usar dentro de Codex.
- Si una regla debe activarse automaticamente, convertirla en una Skill nativa de Codex o incorporarla a instrucciones del entorno.

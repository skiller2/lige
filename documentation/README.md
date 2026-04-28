# Indice Global de Documentacion

Este indice centraliza la documentacion tecnica del monorepo y define el punto de entrada para mantenimiento continuo.

## Objetivos
- Navegacion rapida de documentacion por dominio.
- Trazabilidad entre codigo, ramas y documentos.
- Mantenimiento incremental luego de cada cambio relevante.

## Estructura base
- [Matriz de Cobertura](coverage-matrix.md): estado de cobertura documental por modulo.
- [Mapa de Ramas](branch-map.md): ramas activas, stale y funcion estimada.
- [Ecosistema de Agentes](agents-architecture.md): arquitectura, roles y ciclo de vida de los agentes de IA y sus skills.
- Backend: documentacion por modulo en subcarpetas futuras dentro de docs/back/.
- Frontend: documentacion por dominio funcional en subcarpetas futuras dentro de docs/front/.
- Mensajeria: documentacion de flujos e integraciones en subcarpetas futuras dentro de docs/mess/.

## Convencion de actualizacion
1. Detectar cambios de codigo por diff o commits recientes.
2. Actualizar secciones impactadas en docs.
3. Ajustar matriz de cobertura y mapa de ramas.
4. Registrar riesgos y supuestos cuando falte evidencia.

## Sugerencia de expansion
- docs/back/modulos/<modulo>.md
- docs/front/modulos/<modulo>.md
- docs/mess/modulos/<modulo>.md
- docs/decisiones/ADR-xxxx.md

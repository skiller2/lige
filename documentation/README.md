# Índice Global de Documentación

Este índice centraliza la documentación técnica del monorepo LIGE y define el punto de entrada para mantenimiento continuo.

## Objetivos
- Navegación rápida de documentación por dominio.
- Trazabilidad entre código, ramas y documentos.
- Mantenimiento incremental luego de cada cambio relevante.

## Estructura

### Documentación Global
- [Matriz de Cobertura](coverage-matrix.md): estado de cobertura documental por módulo.
- [Mapa de Ramas](branch-map.md): ramas activas, stale y función estimada.
- [Ecosistema de Agentes](agents-architecture.md): arquitectura, roles y ciclo de vida de los agentes de IA de desarrollo.

### Mensajería — Módulo `mess/`
- [README — Visión General](mess/README.md): stack, estructura, configuración del servicio.
- [Arquitectura](mess/architecture.md): diagrama de componentes, capas, flujos de datos.
- [API Endpoints — ChatBot](mess/api-chatbot.md): contratos HTTP del chatbot.
- [Sistema Multi-Agente IA](mess/multi-agent-system.md): orquestador, sub-agentes, implementación.
- [Flujos WhatsApp](mess/whatsapp-flows.md): flujos de producción con @builderbot.
- [Modelo de Datos](mess/data-model.md): tablas SQL Server y estado volátil.
- [Decisiones de Diseño (ADR)](mess/decisions.md): registro de decisiones arquitectónicas.

### Backend (`back/`)
- Documentación por módulo en subcarpetas futuras dentro de `docs/back/`.

### Frontend (`front/`)
- Documentación por dominio funcional en subcarpetas futuras dentro de `docs/front/`.

## Convención de Actualización
1. Detectar cambios de código por diff o commits recientes.
2. Actualizar secciones impactadas en docs.
3. Ajustar matriz de cobertura y mapa de ramas.
4. Registrar riesgos y supuestos cuando falte evidencia.

## Sugerencia de Expansión
- `docs/back/modulos/<modulo>.md`
- `docs/front/modulos/<modulo>.md`
- `docs/mess/modulos/<modulo>.md`
- `docs/decisiones/ADR-xxxx.md`

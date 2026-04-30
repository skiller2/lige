# Matriz de Cobertura Documental

Estado inicial de cobertura de documentacion por area y modulo.

Leyenda:
- Sin documentar: no existe documento tecnico del modulo.
- Parcial: existe documento pero faltan contratos, flujos o dependencias.
- Completa: incluye responsabilidades, contratos, dependencias y riesgos.

## Backend (back/src)

| Modulo | Estado | Documento | Notas |
|---|---|---|---|
| acceso-bot | Sin documentar | Pendiente | |
| actas | Sin documentar | Pendiente | |
| adelantos | Sin documentar | Pendiente | |
| administradores | Sin documentar | Pendiente | |
| aviso | Sin documentar | Pendiente | |
| carga-licencia | Sin documentar | Pendiente | |
| categorias-cambio | Sin documentar | Pendiente | |
| clientes | Sin documentar | Pendiente | |
| controller | Sin documentar | Pendiente | |
| documento | Sin documentar | Pendiente | |
| domicilio | Sin documentar | Pendiente | |
| efecto | Sin documentar | Pendiente | |
| excepciones-asistencia | Sin documentar | Pendiente | |
| facturacion | Sin documentar | Pendiente | |
| gestion-descuentos | Sin documentar | Pendiente | |
| grupo-actividad | Sin documentar | Pendiente | |
| habilitaciones | Sin documentar | Pendiente | |
| importe-venta-vigilancia | Sin documentar | Pendiente | |
| impuestos-afip | Sin documentar | Pendiente | |
| informes | Sin documentar | Pendiente | |
| liquidaciones | Sin documentar | Pendiente | |
| lista-permisocarga | Sin documentar | Pendiente | |
| middlewares | Sin documentar | Pendiente | |
| novedades | Sin documentar | Pendiente | |
| objetivos | Sin documentar | Pendiente | |
| objetivos-pendasis | Sin documentar | Pendiente | |
| ordenes-de-venta | Sin documentar | Pendiente | |
| parametro-venta | Sin documentar | Pendiente | |
| personal-objetivo | Sin documentar | Pendiente | |
| precios-productos | Sin documentar | Pendiente | |
| procesos-automaticos | Sin documentar | Pendiente | |
| recibos | Sin documentar | Pendiente | |
| reportes | Sin documentar | Pendiente | |
| routes | Sin documentar | Pendiente | |
| salario-minimo-vital-movil | Sin documentar | Pendiente | |
| schemas | Sin documentar | Pendiente | |
| seguros | Sin documentar | Pendiente | |
| telefonia | Sin documentar | Pendiente | |
| valor-hora | Sin documentar | Pendiente | |
| vehiculo | Sin documentar | Pendiente | |

## Frontend (front/src)

| Area | Estado | Documento | Notas |
|---|---|---|---|
| app | Sin documentar | Pendiente | |
| assets | Sin documentar | Pendiente | |
| environments | Sin documentar | Pendiente | |
| styles | Sin documentar | Pendiente | |

## Mensajeria (mess/src)

| Modulo | Estado | Documento | Notas |
|---|---|---|---|
| controller (chatbot) | Completa | [multi-agent-system.md](mess/multi-agent-system.md), [api-chatbot.md](mess/api-chatbot.md) | Sistema multi-agente IA, endpoints HTTP |
| controller (otros) | Completa | [architecture.md](mess/architecture.md) | PersonalController, DocumentosController, NovedadController, ObjetivoController |
| flow | Completa | [whatsapp-flows.md](mess/whatsapp-flows.md) | 26 flujos documentados con tabla comparativa IA |
| agents | Completa | [multi-agent-system.md](mess/multi-agent-system.md) | 5 agentes + guía de extensión |
| data-model | Completa | [data-model.md](mess/data-model.md) | BotLog, BotRegTelefonoPersonal, BotColaMensajes, DocumentoDescargaLog |
| decisiones | Completa | [decisions.md](mess/decisions.md) | 5 ADRs documentadas |
| info | Sin documentar | Pendiente | |
| middlewares | Parcial | [api-chatbot.md](mess/api-chatbot.md) | authMiddleware documentado en endpoints |
| routes | Completa | [api-chatbot.md](mess/api-chatbot.md) | Todos los endpoints del chatbot |
| sqlserver-database | Parcial | [architecture.md](mess/architecture.md) | Adaptador @builderbot mencionado |

## Regla de mantenimiento
- Cuando se cree un documento de modulo, actualizar Estado y Documento en esta matriz.
- Si un cambio de codigo afecta un modulo documentado, revisar su estado y notas.

# Chatbot administrativo: relevamiento y migración propuesta

Fecha: 2026-09-08. Estado: implementación acotada escrita y revisada estáticamente; pendiente de prueba funcional por el usuario. La implementación amplia anterior fue retirada por indicación del usuario. Este documento permite retomar el trabajo sin repetir la exploración.

## Implementación acotada realizada después de la reversión

El usuario pidió retomar lo importante después de revertir los cambios fuera de alcance. El código quedó limitado a:

- `mess/src/controller/chatbot.controller.ts`.
- Los cinco prompts Markdown ya existentes en `mess/agents/`.
- `front/src/app/services/api.service.ts` y `front/src/app/routes/config/mess/mess.component.ts/.html`.

No se modificaron controllers de negocio, SQL de sus métodos, flows, rutas, BotServer, dependencias, scripts de build ni el archivo local `ia-tools.json`. No se crearon servicios en `mess/src/ai`.

### Comportamiento implementado

- `POST /api/chatbot/chat` conserva el header JWT y gSistemas. Recibe `message`, `chatId` (teléfono de prueba), `personalId` (selección del administrativo) y `conversationId` (UUID técnico). Verifica existencia de Personal y vincula la conversación al actor autenticado y a esa selección; no autentica el teléfono ni lo sustituye por el personal del JWT.
- El modelo no recibe `personalId` ni `fecha` de getAdelantoLimits como parámetros solicitables. Se adaptan copias de las definiciones leídas de `ia-tools.json`; el archivo original permanece intacto. Los argumentos de identidad enviados por el modelo se rechazan.
- Router separado como método del mismo controller: recibe una descripción breve de dominios, contexto conversacional breve y mensaje; solo acepta JSON con domain = docs/finanzas/novedades/info/general. No tiene tools. Reenruta cada mensaje, salvo el procesamiento explícito de una confirmación o la espera de una acción pendiente.
- El backend elige el prompt y las tools del dominio. Antes de despachar comprueba allowlist, argumentos contra las definiciones actuales y límites de ejecución. No se agregó un catálogo alternativo. El validador cubre el subconjunto de schema usado por el archivo actual y rechaza keywords no soportadas, sin agregar dependencias.
- La ejecución mantiene las llamadas a los métodos existentes. Los QueryRunner que crea el chat para métodos que reciben uno se abren solo durante la operación y se liberan si el método legacy no los liberó. No se modificó el manejo interno de conexiones de los demás controllers.
- Los resultados útiles vuelven al modelo como mensajes de tool. Se proyectan campos de documentos, adelantos y novedades antes de enviarlos, sin auditoría, códigos de autenticación o identidad innecesaria de terceros.
- No se almacena ni devuelve thinking del modelo. Angular conserva el checkbox «Mostrar uso de herramientas»: muestra dominio, herramientas, argumentos validados, resultados acotados y estados de confirmación mediante un campo `diagnostics` separado de la respuesta. No muestra prompts ni razonamiento interno. El filtro del texto conversacional reduce exposición de nombres de herramientas, SQL y prompts; no es una garantía absoluta contra toda paráfrasis del modelo.
- Confirmación explícita para setPersonalAdelanto, deletePersonalAdelanto, saveNovedad, addNovedad y getURLDocumentoNew. El resumen identifica la solicitud, persona y teléfono seleccionados. Un mensaje «sí» no dispara una escritura.
- Angular confirma/cancela por el mismo endpoint, enviando `confirmation: { id, accept }`. El backend recupera argumentos guardados, verifica propietario, selección, expiración, configuración y schema vigente; luego invoca el método existente. No vuelve a pedir al modelo que elija qué ejecutar.
- El resultado de una acción ejecutada se conserva para responder reintentos de confirmación sin repetir la llamada. Si falla la redacción posterior, se mantiene el resultado de ejecución. Los errores de resultado incierto no se reintentan automáticamente.
- Borradores: siguen usando los métodos y almacenamiento existentes, según la aclaración del usuario. La propuesta de separarlos en memoria no se implementó.
- Las cuatro herramientas de identidad telefónica quedan fuera de las tools ofrecidas al modelo administrativo. setNovedadVisualizacion sigue sin ejecutarse; no se activó una funcionalidad antes comentada. No se borraron sus definiciones ni sus métodos.
- IA Prompt conserva el editor, ahora con apartados General (ia-prompt.txt), Router, Documentos/recibos, Adelantos, Novedades e Información. General se utiliza para el dominio general; cada otro dominio usa su Markdown. IA Herramientas conserva el editor de ia-tools.json. Los cambios usan hash para detectar edición concurrente y escritura temporal/rename.
- Los cambios de configuración se aplican en las próximas llamadas y hacen vencer confirmaciones armadas con una configuración anterior. Cambiar persona/teléfono crea una nueva conversación; no puede mezclarse el historial entre selecciones.

### Límites y verificación

- Hasta 6 pasos especializados por mensaje y 8 tool calls; rechazo de llamadas idénticas dentro del mismo mensaje.
- Hasta 45 s por inferencia y presupuesto de 120 s para el procesamiento de IA, con AbortSignal por request. Los métodos SQL legacy no aceptan cancelación; una operación ya iniciada puede terminar después de ese presupuesto y su estado no se interpreta como un rollback.
- TTL de conversación de 30 min; acciones pendientes de 10 min; hasta 20 turnos y 80.000 caracteres de historial por conversación; 500 conversaciones como máximo. Exclusión de requests simultáneos por conversación. Estado en memoria de una instancia, sin persistencia entre reinicios ni garantías distribuidas.
- La configuración se valida al leerla/usar el chat y al guardar editores, no durante el startup global. BotServer y el orden de arranque permanecen intactos; su carga legacy de tools no es la fuente del nuevo chat, que lee directamente ia-tools.json.
- Se mantuvo Ollama Cloud/gpt-oss:120b. JSON del router solicitado y validado, sin presuponer soporte de format/schema en Cloud.
- Se revisaron referencias de los métodos Angular cambiados, alcance del diff, conservación del código determinístico y whitespace. No se ejecutaron compilaciones, servidor, bot, llamadas al modelo ni pruebas SQL, por la prohibición de CLAUDE.md.
- Pendiente de prueba funcional por el usuario: selección de persona/teléfono, recibos → adelantos → información, consulta que requiere varias tools, solicitud de $50.000 con resumen/confirmación/cancelación, repetición de la misma confirmación, edición de cada prompt y edición de herramientas. También verificar paths de prompts en la forma de despliegue que se utilice.
- Hallazgos de conexiones, transacciones, autenticación de descargas legacy y reglas internas de negocio siguen fuera de esta implementación. Cualquier corrección adicional requiere consulta previa, como indicó el usuario.

## Alcance vigente después de las aclaraciones del usuario

Esta sección reemplaza las propuestas y decisiones pendientes del relevamiento histórico que sigue. El plan amplio anterior no está autorizado para implementar.

- Angular es un entorno de prueba. Un administrativo autenticado con gSistemas puede seleccionar una persona y su teléfono y operar como esa persona en pantalla. Las validaciones de identidad telefónica corresponden al bot de WhatsApp.
- Ante una solicitud que cambia datos, mostrar lo solicitado y pedir confirmación antes de ejecutar. Por ejemplo, resumir importe y período del adelanto antes del alta. No confundir el resumen con una operación ya realizada.
- Conservar el almacenamiento de borradores existente. El usuario aclaró que las pruebas usan personas y teléfonos que no interfieren con las conversaciones de WhatsApp; no introducir otro almacenamiento por esa hipótesis.
- Mantener las secciones IA Prompt e IA Herramientas. Los prompts especializados deben tener apartados de edición; no retirar los editores.
- Reutilizar ia-tools.json y las funciones actuales. No reconstruir el catálogo de herramientas ni cambiar lógica de negocio, SQL o controllers de novedades, documentos, personal y otros como parte de esta tarea.
- Concentrar el trabajo en la estructura usuario → backend → IA, principalmente en chatbot.controller.ts. Cualquier archivo auxiliar o cambio adicional debe concretarse y consultarse antes de implementar si excede ese alcance.
- Instrucción explícita: está prohibido implementar cuestiones adicionales o decisiones que no estén claras sin consultar previamente al usuario. No considerar las recomendaciones de este documento como autorización.
- Se revirtieron los cambios de los ocho archivos versionados afectados y se eliminaron los nueve archivos nuevos de mess/src/ai. No se había modificado chatbot.controller.ts ni Angular. No se ejecutaron servidores, bot, compilaciones u operaciones de base de datos.

En la reversión se conservó únicamente este relevamiento; posteriormente se realizó la implementación acotada descrita arriba. Las secciones siguientes describen el estado original y propuestas históricas, no cambios implementados ni un plan aprobado.

## Alcance y verificación

- Flujo autorizado: Angular administrativo → Express → Ollama → Express → Angular.
- WhatsApp conserva BuilderBot y sus flows determinísticos. No registrar `flowIA`, no introducir envíos, adapters de WhatsApp, Redis ni outbox.
- Se inspeccionaron fuentes, configuración local de IA, SDK instalado y documentación. No se arrancó el servidor, el bot, jobs ni se hicieron consultas SQL o llamadas al modelo.
- `CLAUDE.md` prohíbe ejecutar o compilar el repositorio, incluidos tests y `tsc`. La validación realizada es estática.
- El árbol Git estaba limpio al comenzar. El único cambio de esta etapa es este documento. No se eliminó legacy.
- Los nombres de archivos nuevos y contratos de la sección de migración son propuestas, no componentes existentes.

## 1. Flujo real

1. `front/src/app/routes/config/mess/mess.component.ts` contiene el chat, un selector de personal y un teléfono editable. `changePersona()` consulta `/api/acceso-bot/:PersonalId` y usa el teléfono devuelto como `chatId`. Guarda ese valor en `localStorage`.
2. `front/src/app/services/api.service.ts`, `sendChatMessage()`, envía `{message, chatId}` a `mess/api/chatbot/chat`. `front/proxy.conf.json` quita `/mess` y deriva al puerto 4000.
3. `mess/src/routes/routes.module.ts` registra `/api/chatbot`. `mess/src/routes/chatBot.routes.ts` registra `POST /chat`, con `verifyToken` y `hasGroup(['gSistemas'])`.
4. `ChatBotController.chat()` abre un QueryRunner, busca historial en `botServer.chatmess[chatId]`, toma el agente de un Map estático y agrega el mensaje del usuario.
5. Llama a `botServer.ollama.chat({model: 'gpt-oss:120b', stream: false, messages, tools})`.
6. El agente inicial `orchestrator` recibe instrucciones de autenticación por teléfono. El backend cambia de agente si el texto contiene `derivar a docs/novedades/finanzas/info`.
7. Un switch de 21 nombres ejecuta métodos de controllers. Los resultados vuelven como mensajes `role: 'tool'` con `tool_name`; vuelve a llamar al modelo hasta que no haya tools ni derivación.
8. Devuelve mensajes nuevos usando `sendIt`, incluidos resultados, tool calls, etiquetas de agente y `thinking`. Angular permite mostrarlos con la opción de herramientas.

El bucle tool → resultado → modelo ya existe y debe conservarse. No existe un router independiente ni un límite de iteraciones.

### Historial y agente

- `chatmess` es un array usado como diccionario por teléfono. Se comparten conversaciones entre actores que envían el mismo identificador.
- `ChatBotController.activeAgents` es un `Map<string,string>` separado. El agente queda fijo hasta reiniciar; solo `orchestrator` interpreta derivaciones.
- No hay TTL, límite de historial, límite de conversaciones ni lock para el endpoint administrativo.
- `reinicia()` borra por `chatId` sin comprobar propietario.
- Los setters de prompt/tools vacían todo `chatmess`, pero no el Map de agentes.
- `BotServer.userQueues/userLocks` corresponden al experimento conectado a `processUserMessage`; no protegen el chat HTTP.

## 2. Identidad y permisos: hechos y decisión pendiente

`back/src/controller/auth.controller.ts` autentica contra LDAP/AD. En `signin()` busca `PersonalId` por CUIT de `description` o la relación existente `Usuario.UsuarioNombreLDAP → UsuarioPersonalId`, y firma el resultado junto con `userName`, grupos y grupos de actividad. Si no encuentra persona, firma `PersonalId: 0`; toma la primera fila si encuentra varias.

`mess/src/middlewares/authJwt.ts` verifica la firma del header `token` y expone:

- `res.locals.userName`: actor autenticado, identificador textual.
- `res.locals.PersonalId`: persona del JWT.
- `req.groups`: nombres de grupos AD.
- `res.locals.GrupoActividad`: grupos de actividad; recarga estos grupos después de 20 minutos, no la relación de identidad ni todos los permisos AD.

No hay un actor numérico en el contrato autenticado inspeccionado. Se puede adaptar el concepto a `actorId: string` usando `userName`; no corresponde inventar que `UsuarioId` está disponible. `BaseController.getUsuarioId()` tampoco resuelve esto de forma general: consulta por `PersonalId` cuando este es cero.

El chat solamente usa `userName` para crear el QueryRunner exterior. La persona efectiva sale de `getPersonaState(chatId)` y, si falta, de `tool.function.arguments.personalId`. El modelo recibe incluso estado/código de autenticación telefónica. No hay autorización efectiva por tool ni control determinístico de situación habilitada en el chat.

La pantalla actual permite seleccionar otra persona. No se puede deducir si la nueva versión será autoservicio del usuario autenticado o gestión administrativa de terceros. Tampoco puede deducirse que `gSistemas` autorice todas las operaciones: `/api/acceso-bot` usa `gPersonal/gConsejo`, y las rutas de adelantos de `back` usan `Liquidaciones/gConsejo/Responsables/Administrativo` para escrituras. Son accesos distintos, no una política unificada del chat.

**D1 pendiente:** definir persona objetivo, permisos por operación y tratamiento del usuario sin `PersonalId`. Recomendación inicial: autoservicio con `PersonalId` válido del JWT, actor textual del JWT y rechazo si falta identidad; si se mantiene administración de terceros, definir expresamente la autorización de esa selección en backend. La selección nunca debe venir del modelo ni del identificador de conversación.

## 3. Inventario verificado de las 21 tools

Fuente de schemas actual: `back/docs/ia-tools.json`, existente localmente pero ignorado por Git. Los argumentos de esta tabla reflejan el archivo actual, no schemas propuestos.

| Dominio actual | Tool | Argumentos actuales | Efecto real y observaciones |
| --- | --- | --- | --- |
| orchestrator | `getPersonaState` | ninguno; backend usa chatId | Lectura de registro telefónico/persona/situación y código de acceso. Debe salir del catálogo de IA. |
| orchestrator | `genTelCode` | ninguno; backend usa chatId | Genera enlace cifrado de registro; no escribe SQL en este método. Es una capacidad sensible de identidad y debe salir de IA. |
| orchestrator | `removeCode` | ninguno; backend usa chatId | Escritura: pone `BotRegTelefonoPersonal.Codigo` en NULL. Debe salir de IA. |
| orchestrator | `delTelefonoPersona` | ninguno; backend usa chatId | Destructiva: elimina registro telefónico. Debe salir de IA. |
| docs | `getLastPeriodosOfComprobantesAFIP` | personalId, cant | Lectura de períodos/comprobantes MONOT. Retorna IDs y nombre de archivo. |
| docs | `getLastPeriodoOfComprobantes` | personalId, cant | Lectura de períodos/documentos REC. No retorna importe neto del recibo. |
| docs | `getDocsPendDescarga` | personalId | Lectura de documentos propios y generales habilitados para descarga bot; incluye datos técnicos. |
| docs | `getURLDocumentoNew` | DocumentoId | Lectura/generación de URL, sin verificar pertenencia. No registra una descarga. |
| finanzas | `getAdelantoLimits` | fecha | Cálculo backend; el switch reemplaza fecha por la fecha actual. |
| finanzas | `getPersonalAdelanto` | personalId, anio, mes | Lectura de adelantos de esa persona/período; incluye auditoría. |
| finanzas | `setPersonalAdelanto` | personalId, anio, mes, importe | Escritura con reemplazo: borra solicitudes no aprobadas del período, inserta y actualiza numerador de Personal. |
| finanzas | `deletePersonalAdelanto` | personalId, anio, mes | Destructiva: elimina solicitudes no aprobadas del período bajo condiciones actuales. No elimina por adelantoId. |
| novedades | `getBackupNovedad` | personalId | Lectura de `BotRegTelefonoPersonal.JsonNovedad`, compartido con WhatsApp. |
| novedades | `saveNovedad` | personalId, novedad | Escritura del borrador JSON; `{}` lo limpia. Schema interno del objeto sin definir. |
| novedades | `getObjetivoByCodObjetivo` | CodObjetivo | Lectura por código `ClienteId/ClienteElementoDependienteId`; sin autorización de pertenencia en el método. |
| novedades | `getNovedadTipo` | ninguno | Lectura de códigos y descripciones de tipos. |
| novedades | `addNovedad` | CodObjetivo, personalId, novedad | Inserta Novedad, incrementa GenNumerador y limpia borrador telefónico. El switch no utiliza el CodObjetivo externo; consume campos del objeto novedad. |
| novedades | `getNovedadesPendientesByResponsable` | personalId | Lectura por objetivos de responsabilidad. Devuelve también teléfono, CUIT y datos de terceros. |
| novedades | `setNovedadVisualizacion` | NovedadCodigo, personalId | El método actualiza fecha/persona/teléfono de visualización, pero su invocación en el chat está comentada: hoy devuelve `{}` sin ejecutar. |
| info | `getInfoPersonal` | personalId | Lectura compuesta: socio, ingreso, situación, categorías y contacto del responsable. Depende del registro telefónico para la consulta inicial. |
| info | `getInfoEmpresa` | ninguno | Texto institucional fijo, sin SQL. |

No hay tool de SQL genérico, envío de mensajes ni actualización/eliminación general de novedades en este catálogo. `addNovedad()` no envía mensajes por sí mismo. El flow determinístico `flowNovedadEnvio` llama separadamente a `sendMsgResponsable()`; el nuevo ejecutor no debe incorporar esa llamada.

### Implementaciones reutilizables y problemas concretos

- `PersonalController`: reutilizar cálculos y reglas de adelantos. Hoy aplica límites de 10.000/150.000, fecha máxima día 18 y período corriente para alta/modificación. No cambiar esos valores por inferencia. `maxCantAdelantos` está declarado, pero no es una validación general contra aprobados en `setPersonalAdelanto()`.
- Alta de adelanto: varias escrituras sin transacción; el numerador se lee y luego se actualiza. Hace falta atomicidad/concurrencia sin reinterpretar las reglas de aprobación. La eliminación comprueba fecha de aprobación y el DELETE filtra `PersonalPrestamoAprobado IS NULL`; verificar con el usuario cualquier corrección funcional de esa diferencia.
- `getInfoPersonal()` consulta `getPersonalQuery(chatId, personalId)` con un OR entre teléfono y persona, usa `[0]` y presupone un responsable presente. Debe eliminarse la dependencia de teléfono del camino administrativo y manejar resultados vacíos.
- `DocumentosController`: reutilizar SELECTs, pero validar/parametrizar `cant`: actualmente se interpola en `TOP ${cant}` sin validación backend. No alcanza con declarar `number` en un schema que solo recibe el modelo.
- `BaseController.getURLDocumentoNew()`: retorna únicamente URL, pero consulta `SELECT *` y no valida quién puede acceder. `mess/src/routes/documentos.routes.ts` publica la descarga sin JWT y `downloadDocument()` consulta por ID, sin pertenencia. Es una brecha existente compartida con WhatsApp; no cerrar esa ruta indiscriminadamente porque alteraría sus descargas.
- Hay un camino administrativo existente en `back/src/routes/file-upload.routes.ts`: `/downloadFile/:id/:tableForSearch/:filename`, con JWT y `hasAuthByDocId()`. Evaluar reutilizarlo con descarga autenticada desde Angular, después de definir el alcance de documentos. No asumir que un enlace Markdown envía el header token.
- `NovedadController`: conservar SQL y servicios útiles, pero resolver objetivo y tipo con datos backend antes de insertar. `novedad.Tipo.NovedadTipoCod || novedad.TipoNovedadId` puede fallar si falta `Tipo`, aun existiendo el fallback. No aceptar objetos JSON libres ni `files`, identificadores de persona o campos de auditoría inventados por IA.
- Las tools actuales de recibos permiten listar/descargar, no responder cuánto cobró alguien: no hay extracción de neto. Tampoco `getInfoPersonal()` devuelve domicilio. Los ejemplos del objetivo no son funcionalidades ya disponibles.

## 4. Confirmaciones y borradores

Las escrituras/destructivas reales son `removeCode`, `delTelefonoPersona`, `saveNovedad`, `addNovedad`, `setPersonalAdelanto`, `deletePersonalAdelanto`; `setNovedadVisualizacion` tiene implementación de escritura, actualmente inactiva en chat. `genTelCode` genera una capacidad de registro aunque no escriba SQL.

**D2 pendiente:** política de confirmación. Recomendación: confirmación explícita Angular para crear/reemplazar adelanto, eliminar adelanto y presentar novedad. Las cuatro tools del orchestrator se excluyen por alcance, sin tocar sus usos determinísticos. No activar `setNovedadVisualizacion` sin definir si corresponde habilitarla y qué confirmación exige. El prompt de documentos también exige confirmar descargas: decidir si se conserva ese requisito como política backend.

**D3 pendiente:** aislar borradores administrativos del registro telefónico. Recomendación: estado de borrador en ConversationStore; guardar allí no sería una escritura de negocio. La presentación confirmada crearía Novedad sin borrar el borrador de WhatsApp. Esto cambia la persistencia actual: memoria local se pierde al reiniciar. No reutilizar `addNovedad()` sin separar su efecto de limpieza de `JsonNovedad`.

Los métodos de creación/visualización requieren teléfono para auditoría. El contrato administrativo no debería pedirlo al modelo. Falta definir si se toma el teléfono registrado desde backend y qué hacer cuando no existe; no se verificó nulabilidad de esas columnas en una base real y no se inventará un valor.

PendingAction propuesto: ID aleatorio, actor, persona, conversación, tool, dominio, argumentos validados, resumen backend, creación, expiración y estado. Confirmar/cancelar mediante API explícita; ninguna respuesta textual como «sí» autoriza. La confirmación carga la acción guardada, revalida autorización/reglas y ejecuta exactamente esa acción sin pedir al modelo que la reconstruya.

Usar estado intermedio `executing` además de pending/executed/cancelled/expired, exclusión mutua y clave de idempotencia. Una operación aplicada debe seguir figurando como aplicada aunque falle la redacción posterior. No reintentar automáticamente escrituras de resultado incierto. Un almacén local solo garantiza protección dentro de esa instancia; no prometer ejecución exactamente una vez entre reinicios o múltiples procesos.

## 5. QueryRunner

`DBServer.connection()` delega a `getConnection()` en `mess/src/data-source.ts`, que crea un QueryRunner y asigna `data.user`. No lo libera automáticamente. En SQL Server la reserva física concreta depende del driver; el problema comprobado es el ciclo de vida del runner, su uso durante todo el bucle y la falta de ownership claro.

- `chat()` crea el runner antes de validar mensaje y fuera del try; no tiene finally de liberación. Puede retornar por mensaje vacío con runner ya creado.
- `getLastPeriodoOfComprobantes()` y `getLastPeriodosOfComprobantesAFIP()` liberan el runner recibido desde fuera. El primero además retorna una promesa sin await dentro del try, por lo que entra al finally antes de su resolución.
- El siguiente tool call puede recibir ese mismo runner ya liberado.
- `saveNovedad()` y `addNovedad()` usan el runner prestado sin liberarlo, una convención diferente.
- Los métodos de personal, novedades y objetivos usados por tools que crean sus propios runners omiten en general su liberación; lo mismo ocurre en helpers internos de información personal.
- Esos métodos también son llamados por flows de WhatsApp. Cambiar ownership requiere revisar cada caller; no basta con borrar un finally.

Convención propuesta única: **quien crea el QueryRunner lo libera en finally; quien lo recibe prestado no lo libera ni decide commit/rollback**. Un servicio de operación agrupa validación SQL y escrituras de una acción en transacción corta; no hay runner durante routing, inferencia o confirmación. Usar el actor autenticado para auditoría administrativa, no `getUser(null)` que registra `bot`.

Mantener firmas compatibles o wrappers de operación para callers determinísticos; cualquier ajuste en flows se limitaría a ownership de recursos, sin alterar su comportamiento funcional ni incorporar IA.

## 6. Configuración, prompts y proveedor

- `BotServer` crea `Ollama` con host fijo `https://ollama.com` y `OLLAMA_API_KEY`; el modelo se fija en el controller.
- `mess/.env` declara `PATH_DOCUMENTS="../back/docs"`. Existen allí `ia-tools.json` e `ia-prompt.txt`, ambos ignorados por Git. Una instalación limpia no dispone de ellos.
- El path es relativo al directorio de ejecución; BotServer usa fallback vacío y BaseController usa `.`. La configuración crítica de IA está mezclada con documentos operativos.
- `BotServer.init()` calcula `iaToolsHash` sobre `this.iaTools` antes de asignar el JSON leído. Luego captura cualquier error y continúa; falta validar forma, nombres, dominios y schemas en startup.
- Los prompts especializados sí están versionados en `mess/agents/`. `getAgentPrompt()` lee sincrónicamente en runtime usando `__dirname`, no definido por ese módulo ESM. El build inyecta un `__dirname` de dist, pero no copia prompts y la ruta relativa no corresponde a `mess/agents` en ese escenario. Debe funcionar tanto en fuente como en bundle.
- Si falta el Markdown, solo se registra el error y se devuelve undefined. El fallback a `iaPrompt` está comentado, pese a que `documentation/mess/decisions.md`, ADR-005, lo documenta como vigente.
- `ia-prompt.txt` y el prompt embebido conservan autenticación por teléfono e instrucciones WhatsApp. Los endpoints/editor de Angular siguen leyéndolos/escribiéndolos, aunque no son el prompt efectivo del chat especializado. No son simplemente archivos eliminables.
- Los schemas permiten `personalId`, carecen de restricciones de enteros/rangos/propiedades extra y dejan `novedad` abierto. Deben derivarse de implementaciones verificadas y validarse en servidor.
- `mess/package.json` no declara Zod/Ajv como dependencia directa. Propuesta: Zod con exportación JSON Schema, evitando duplicar schema y validador; alternativa: JSON Schema versionado con Ajv. No escribir un validador JSON Schema casero.

El SDK instalado soporta `ChatRequest.format: string | object`, tools y fetch configurable. Sin embargo, la [documentación oficial de Ollama](https://docs.ollama.com/capabilities/structured-outputs), consultada el 2026-09-08, declara que Cloud aún no soporta structured outputs.

Propuesta conservando Cloud: router pequeño, sin tools de negocio, que solicite exclusivamente `{ "domain": "..." }`; parser JSON estricto y validación de enum/propiedades en backend. Si no es válido, error controlado sin ejecutar tools. No confundir JSON solicitado por prompt con generación restringida por schema. `format` con schema queda disponible si se configura explícitamente un servidor compatible. No cambiar proveedor o modelo silenciosamente.

`Ollama.abort()` en el SDK inspeccionado aborta streams; no cancela las llamadas actuales `stream:false`. El timeout debe cancelar mediante AbortSignal/fetch por request, sin abortar conversaciones ajenas ni usar solo Promise.race mientras continúa una operación.

**D4 pendiente:** destino de los editores actuales. Recomendación: prompts y tools versionados como única fuente efectiva; mantener consulta administrativa útil y dejar de permitir editar definiciones operativas desde esos endpoints. No continuar mostrando un editor que aparenta cambiar el prompt real pero no lo hace. Conservar archivos legacy hasta migración explícita.

## 7. Código experimental y legacy

- `mess/src/flow/flowIA.ts` exporta el keyword LINCE_IA; no se importa ni está registrado en `createFlow()`.
- `flowLogin1`, en `flowLogin.ts`, también encola mensajes hacia el experimento, pero no está registrado/importado por BotServer; el registrado es `flowLogin` determinístico.
- `processUserMessage()` hace streaming a Ollama con el literal «Buenos dias» y usa `flowDynamic`. Solo se encontraron referencias desde la cola experimental.
- Permanecen `userQueues`, `userLocks`, `handleQueue`, `ASSISTANT_ID`, import de `toAsk/httpInject` y dependencia `@builderbot-plugins/openai-assistants`. No se encontraron invocaciones de esas funciones OpenAI en el flujo actual.
- El chat administrativo sigue acoplado a BotServer por cliente Ollama/configuración/historial; desacoplarlo no requiere activar otro flow.
- `ChatBotController` también contiene QR, delay, control del bot y métodos de cola usados por otros módulos. No eliminar ni moverlos todos por el hecho de reducir `chat()`.
- La documentación afirma que todas las rutas de chatbot tienen JWT; `/gotoFlow` no tiene middleware de autenticación en su declaración. Es un hallazgo del control determinístico, fuera del nuevo flujo de IA.

No borrar estas piezas en la etapa actual. Primero separar el camino administrativo y comunicar qué limpieza se hará; preservar operaciones determinísticas y sus dependencias.

## 8. Separación y archivos propuestos

### Modificar gradualmente

- `mess/src/controller/chatbot.controller.ts`: adelgazar chat/reinicio; adaptar endpoints de configuración según D4. Preservar operaciones de bot/cola.
- `mess/src/routes/chatBot.routes.ts`: validación/identidad y acciones explícitas de confirmar/cancelar, conservando autenticación real. Evitar el desajuste de mayúsculas con el import `chatbot.routes.ts`.
- `mess/src/index.ts` y `mess/src/bot-server.ts`: composición del chatbot y validación de configuración antes de aceptar tráfico; sacar estado/cliente de IA administrativa de BotServer sin tocar la lista determinística de flows.
- `mess/src/controller/personal.controller.ts`, `documentos.controller.ts`, `novedad.controller.ts`, `objetivo.controller.ts`, `base.controller.ts`: operaciones verificadas, DTOs, auditoría, parámetros y ownership; limitar cambios compartidos a los necesarios y revisar callers.
- `mess/scripts/build.mjs`: distribuir prompts versionados y resolver paths de fuente/bundle.
- `mess/package.json`, `mess/.env.example`: dependencia de validación y configuración explícita, sin credenciales versionadas.
- Prompts existentes `mess/agents/bot-*.md`: conservar dominios y estilo útil, retirar autenticación, formato WhatsApp, confirmaciones verbales y responsabilidades de negocio del modelo.
- `front/src/app/services/api.service.ts` y `front/src/app/routes/config/mess/mess.component.{ts,html}`: conversación técnica, identidad según D1, contrato de respuesta limpio, tarjetas de acción y confirmación/cancelación, descarga autenticada, configuración según D4.
- Documentación de arquitectura/API/decisiones para que describa lo implementado y no fallback inexistente.

### Crear responsabilidades concretas en `mess/src/ai/`

| Archivo propuesto | Responsabilidad |
| --- | --- |
| `types.ts` | Contexto autenticado, agente, tool, mensaje permitido, conversación, acción y respuesta pública. |
| `config.ts` | Validación de configuración y recursos; conexión a Ollama separada del bot. |
| `agent-registry.ts` | Carga de prompts versionados y allowlists verificadas; general sin tools de negocio. |
| `intent-router.service.ts` | Solo selección validada de dominio; no devuelve prompts. |
| `tool-registry.ts` | Nombre, descripción, schema, dominio, riesgo, confirmación y función backend. |
| `tool-executor.ts` | Validación de tool/allowlist/args/contexto, normalización, resultados y errores seguros. |
| `action-policy.ts` | Funciones concretas de autorización y confirmación según decisiones; no clase vacía. |
| `conversation-store.ts` | Interfaz y memoria local: propietario, TTL, tamaño, lock, borrador y mensajes permitidos. |
| `pending-action.service.ts` | Estado y transición atómica de confirmación, expiración y ejecución. Puede guardar acciones en ConversationStore. |
| `ai-orchestrator.service.ts` | Routing por mensaje, especialización, loop acotado, resultados al modelo y respuesta pública. |
| `response-sanitizer.ts` | Proyección explícita de campos y contenido seguro; sin datos de debugging. |

Prompts nuevos mínimos: router puro y respuesta general. Reutilizar archivos por dominio existentes; no duplicar especificaciones de parámetros en Markdown. Servicios de dominio adicionales solo donde sea necesario separar efectos de WhatsApp o evitar dependencias HTTP.

### Routing, límites y contrato propuestos

- Rutear cada mensaje nuevo, con último dominio y un contexto breve para continuaciones. No introducir heurísticas textuales que fijen agente. Confirmar/cancelar una PendingAction evita routing y ejecuta el estado guardado.
- Enviar al agente solo prompt propio, historial relevante y tools permitidas. Volver a verificar allowlist en cada ejecución.
- Validar toda propuesta; rechazar `personalId`, identidad anidada o propiedades extra antes de ejecutar. Resolver IDs de objetivo/tipo y pertenencia en backend, no confiar en los valores que acompañan descripciones.
- Historial: conservar mensajes conversacionales y secuencias completas tool-call/result necesarias; nunca spread de `response.message`. Eliminar thinking antes de guardar o construir contexto.
- Resultados mínimos: períodos/etiquetas/referencias de documento; importe/período/estado del adelanto; código/fecha/tipo/objetivo/descripcion/acción de novedades. Omitir auditoría, código de acceso, CUIT/teléfonos ajenos y datos técnicos innecesarios. No enviar resultados de otro dominio por defecto.
- Respuesta Angular: texto final y, cuando corresponda, acción pendiente con ID/resumen/expiración y adjuntos autorizados. No exponer schema, tool, agente, SQL, prompts, thinking ni excepciones crudas. Los resúmenes y resultados de ejecución sensible los fija backend; un texto del modelo no prueba que se ejecutó una acción.
- Sanitización con contrato explícito y filtros de contenido; regex por sí sola no garantiza que un modelo nunca parafrasee un prompt. Mantener secretos fuera de sus entradas y dar respuesta segura cuando se detecta contenido interno.
- Propuesta inicial, **no fijada**: 1 routing + hasta 6 pasos especializados, hasta 8 tool calls por request; impedir tool calls idénticos normalizados (reusar lectura o devolver error seguro, sin repetir escrituras).
- Propuesta inicial, **no fijada**: 45 s por inferencia, 120 s por request total, TTL conversacional de 30 min, hasta 20 turnos completos y 10 min para confirmar una acción. Añadir límite global de conversaciones y tamaño de resultados para acotar memoria.
- El deadline incluye validaciones; no iniciar otra tool después de vencer. Si una escritura SQL ya comenzó, preservar su resultado real y estado de acción; no confundir timeout con rollback ni habilitar reintento automático.

## 9. Secuencia de migración y verificación

1. Resolver D1–D4 y autorizaciones de documentos/objetivos; acordar límites propuestos. No ejecutar SQL de negocio ni elegir persona hasta entonces.
2. Corregir contexto autenticado y conversación técnica; retirar tools de autenticación del catálogo administrativo y el fallback a personalId del modelo.
3. Versionar/validar configuración y schemas; comprobar nombres/allowlists/prompts al iniciar. Resolver distribución ESM/bundle y la edición administrativa.
4. Introducir registry/router/executor y mover el loop al orquestador, conservando resultados de tools al modelo. Aplicar presupuestos y cancelación.
5. Encapsular servicios de operación y transacciones, corregir QueryRunner/parametrización/pertenencia/DTOs, preservando callers determinísticos.
6. Introducir ConversationStore y PendingAction con UI explícita; separar borrador de WhatsApp si se confirma D3.
7. Contrato público y sanitización; eliminar thinking de almacenamiento, modelo y UI. Migrar descargas administrativas a un camino autenticado.
8. Actualizar documentación; presentar y luego realizar solo la limpieza legacy acordada.

Verificación a preparar para la implementación: contexto sin JWT/persona; intento de cambiar personalId y usar conversación ajena; tool fuera de allowlist; schema inválido y cant malicioso; cambio de dominio y continuación; resultados devueltos a Ollama; repetición/límites/timeout; acción vencida/ajena/doble confirmación/concurrencia/cancelación; pérdida de permisos antes de confirmar; éxito SQL seguido de error de redacción; liberación de runner en éxito/error; ausencia de thinking/SQL en respuesta; falta de prompt/tools en startup; registro de BuilderBot sin IA. No ejecutar estas pruebas sin resolver la restricción local de ejecución.

## 10. Punto de reanudación

El relevamiento está completo; la refactorización no está implementada. Esperar definiciones funcionales sobre:

1. **D1:** autoservicio o terceros y autorización exacta por operación/objetivo/documento; tratamiento de actor sin PersonalId. No equiparar gSistemas a permiso irrestricto.
2. **D2:** confirmaciones de adelantos/novedades, descargas y eventual habilitación de visualización.
3. **D3:** borrador aislado en memoria y teléfono de auditoría cuando no existe registro.
4. **D4:** retiro de edición operativa de prompts/tools desde Angular a favor de archivos versionados.

La propuesta técnica conserva Ollama Cloud con JSON de routing validado, rerouting por mensaje y límites configurables indicados. No sustituir estas decisiones por supuestos al retomar.

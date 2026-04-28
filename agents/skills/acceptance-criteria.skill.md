---
name: acceptance-criteria
description: Genera criterios de aceptacion testeables a partir de requerimientos funcionales y tecnicos de un ticket. Cada criterio debe ser observable, verificable y sin ambiguedad.
---

# Skill: acceptance-criteria

## Proposito
Transformar requerimientos funcionales y tecnicos en criterios de aceptacion especificos, observables y testeables para QA y desarrollo.

## Reglas de generacion

### Un criterio valido debe:
- Comenzar con un verbo observable: "Muestra", "Ejecuta", "Inserta", "Redirige", "Valida", "Bloquea"
- Describir el resultado esperado, no la implementacion
- Ser verificable manualmente o por test automatizado
- Tener un unico punto de verdad (no combinar dos condiciones en uno)

### Un criterio invalido es:
- Vago: "Funciona correctamente", "Se ve bien", "Mejora la experiencia"
- No verificable: "Es rapido", "Es seguro" (sin metrica)
- Ambiguo: "El boton hace algo al hacer clic"

---

## Categorias de criterios a generar

Evaluar cuales aplican segun el ticket:

### UI / Interaccion
- El elemento [X] es visible en [pantalla] al [condicion]
- Al hacer clic en [boton], [accion observable ocurre]
- El [componente] se cierra/abre cuando [condicion]
- El dato [X] aparece resaltado/con formato [Y] en [ubicacion]

### Datos / Backend
- La consulta devuelve [datos esperados] para [caso de prueba]
- El endpoint [ruta] responde con status [200/400/etc] cuando [condicion]
- El campo [X] contiene el valor correcto segun [tabla/logica]

### Persistencia / DB
- Se inserta un registro en [tabla] con los campos [lista] al [accion]
- No se duplican registros al ejecutar [accion] mas de una vez
- El registro en [tabla] contiene timestamp, usuario y accion correctos

### Seguridad / Permisos
- Un usuario sin permiso [X] no puede ver/ejecutar [funcion]
- Los datos de [usuario A] no son visibles para [usuario B]
- El token JWT es validado antes de ejecutar [endpoint]

### Edge cases
- Si [dato] no existe, muestra [mensaje/estado vacio] en lugar de error
- Si la consulta tarda mas de [N] segundos, muestra indicador de carga
- Si el servicio falla, muestra mensaje de error sin exponer detalles tecnicos
- Si se aplica un filtro de fechas o valores, especificar el limite exacto incluyendo el tope con `>=` o `<=`

---

## Formato de salida

Usar formato Redmine-compatible:

```
h2. Criterios de Aceptacion

* [x] [Categoria] — [descripcion testeable del resultado esperado]
* [x] [Categoria] — [descripcion testeable del resultado esperado]
```

Ejemplo para un drawer con consulta:
```
h2. Criterios de Aceptacion

* [x] UI — Boton "Datos Bot" aparece a la derecha del boton "Detalle Persona" en pantalla Detalle Asistencia
* [x] UI — Al hacer clic en "Datos Bot", se abre drawer desde la derecha sin errores
* [x] Datos — El drawer muestra el numero de telefono registrado en @AccesoBot@ para el PersonalId activo
* [x] UI — Al hacer clic en "Ver Numero de Recibo", el numero aparece dinamicamente bajo el boton resaltado
* [x] DB — Se inserta un registro en @EventoLog@ con usuario, accion y timestamp al consultar el nro de recibo
* [x] Seguridad — El endpoint solo devuelve datos del PersonalId del usuario autenticado
* [x] Edge case — Si no hay recibo registrado, muestra mensaje "Sin recibos disponibles" en lugar de error
```

---

## Comportamiento
- Generar al menos 5 criterios por ticket de mediana complejidad.
- Siempre incluir al menos: 1 criterio UI, 1 de datos/backend, 1 de DB (si aplica), 1 de seguridad, 1 edge case.
- Si un campo esta [A DEFINIR], generar el criterio con el placeholder visible para que el analista lo complete.
- No mezclar criterios de UI con criterios de DB en el mismo punto.

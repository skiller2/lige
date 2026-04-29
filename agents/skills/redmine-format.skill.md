---
name: redmine-format
description: Convierte contenido estructurado de ticket al formato wiki de Redmine. Aplica headings h2, listas, codigo inline, checkboxes y tablas segun el estandar de Redmine textile.
---

# Skill: redmine-format

## Proposito
Transformar cualquier ticket estructurado al formato wiki de Redmine listo para copiar y pegar, sin necesidad de reescribir el contenido.

## Reglas de formato Redmine (Textile)

### Headings
```
h2. Titulo de seccion
h3. Subseccion
```

### Listas no ordenadas
```
* item
** sub-item
```

### Listas ordenadas
```
# paso 1
# paso 2
```

### Texto en negrita
```
*texto en negrita*
```

### Codigo inline (nombres de tablas, endpoints, campos, componentes)
```
@nombre_tabla@
@GET /api/ruta@
@NombreComponente@
```

### Checkboxes (criterios / checklist)
Pendiente:  * [ ] descripcion
Completado: * [x] descripcion

### Tablas
```
|_.Columna 1|_.Columna 2|_.Columna 3|
|Valor 1|Valor 2|Valor 3|
```

### Notas / advertencias
```
> Nota: texto de advertencia
```

## Estructura de salida estandar

Usar siempre este orden al generar el ticket en formato Redmine:

```
h2. Contexto / Problema
[contenido]

h2. Objetivo Esperado
[contenido]

h2. Alcance
* [item]

h2. No Alcance
* [item]

h2. Requerimientos Funcionales
* [item]

h2. Requerimientos Tecnicos
* *Controller/Servicio backend*: @NombreController@
* *Componente Angular*: @nombre-componente.component.ts@
* *Módulo de ruta*: @ges/modulo@
* *Endpoint*: @GET /api/ruta@ o [A DEFINIR]
* *Tablas DB*: @NombreTabla@ o [A DEFINIR]

h2. Datos de Prueba / Casos
|_.Campo|_.Valor|
|Usuario|[A COMPLETAR]|

h2. Criterios de Aceptacion
* [x] criterio 1
* [x] criterio 2

h2. Riesgos / Dependencias
* *Dependencia*: [descripcion] [A COMPLETAR / A DEFINIR]
* *Riesgo*: [descripcion]

h2. Checklist para Desarrollo
* [ ] tarea 1
* [ ] tarea 2

h2. Notas
* [A COMPLETAR]: [campo pendiente]
```

## Comportamiento
- Aplicar este formato a cualquier ticket que el tkt-agent haya estructurado.
- No cambiar el contenido, solo transformar al formato wiki Redmine.
- Mantener los placeholders [A COMPLETAR] y [A DEFINIR] intactos.
- Los nombres de tablas, endpoints y componentes siempre van con @codigo@.

const listaColumnas: any[] = [
  {
    id: "CUIT",
    name: "CUIT",
    field: "CUIT",
    fieldName: "cuit2.PersonalCUITCUILCUIT",
    type: "number",
    sortable: true,
    searchHidden: false
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "per.PersonalId",
    searchComponent:"inpurForPersonalSearch",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Sit Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Importe",
    type: "currency",
    id: "monto",
    field: "monto",
    fieldName: "des.PersonalOtroDescuentoImporteVariable",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Grupo Numero",
    type: "number",
    id: "GrupoActividadNumero",
    field: "GrupoActividadNumero",
    fieldName: "ga.GrupoActividadNumero",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Grupo Persona",
    type: "string",
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    fieldName: "ga.GrupoActividadDetalle",
    searchType:"string",
    sortable: true,
    searchHidden: false
  },
  {
    name: "Grupo Objetivo",
    type: "string",
    id: "GrupoDetalleOBJ",
    field: "GrupoDetalleOBJ",
    fieldName: "ga.GrupoActividadDetalle",
    sortable: true,
    searchHidden: false,
    hidden:true
  },
  {
    name: "ID Descuento",
    field: "descuento",
    type: "number",
    id: "PersonalOtroDescuentoId",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  /*
  {
    name: "PersonalIdJ",
    type: "string",
    id: "PersonalIdJ",
    field: "PersonalIdJ",
    fieldName: "perrel.PersonalCategoriaPersonalId",
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  */
  {
    name: "Cliente",
    type: "string",
    id: "ClienteId",
    field: "ClienteId",
    searchComponent:"inpurForClientSearch",
    fieldName: "obj.ClienteId",
    hidden: true,
    searchHidden: false 
  },
  {
    name: "Sucursal",
    type: "string",
    id: "Sucursal",
    field: "Sucursal",
    fieldName: "suc.SucursalId",
    searchComponent:"inpurForSucursalSearch",
    searchType:"number",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Exceptuado",
    type: "boolean",
    id: "PersonalExencionCUIT",
    field: "PersonalExencionCUIT",
    fieldName: "excep.PersonalExencionCUIT",
    searchType:"number",
    sortable: true,
    hidden: false,
    searchHidden: false
  },

];

const findColumnByIndex = (field: string, list: any[]) => {
  return list.find((columna) => columna.field === field);
};

export { listaColumnas, findColumnByIndex };

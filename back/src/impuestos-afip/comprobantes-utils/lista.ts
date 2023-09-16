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
    name: "CUIT Responsable Persona",
    type: "number",
    id: "CUITJ",
    field: "CUITJ",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    name: "Responsable Persona",
    type: "string",
    id: "ApellidoNombreJ",
    field: "ApellidoNombreJ",
    fieldName: "perrel.PersonalCategoriaPersonalId",
    searchComponent:"inpurForPersonalSearch",
    searchType:"number",
    sortable: true,
    searchHidden: false
  },
  {
    name: "Responsable Objetivo",
    type: "string",
    id: "ApellidoNombreRO",
    field: "ApellidoNombreRO",
    fieldName: "opj.ObjetivoPersonalJerarquicoPersonalId",
    searchComponent:"inpurForPersonalSearch",
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
    searchComponent:"Sucursal",
    searchType:"number",
    sortable: true,
    hidden: true,
    searchHidden: false
  },

];

const findColumnByIndex = (field: string, list: any[]) => {
  return list.find((columna) => columna.field === field);
};

export { listaColumnas, findColumnByIndex };

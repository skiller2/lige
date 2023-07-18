const listaColumnas: any[] = [
  {
    id: "CUIT",
    name: "CUIT",
    field: "CUIT",
    fieldName: "cuit2.PersonalCUITCUILCUIT",
    type: "number",
    sortable: true,
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    sortable: true,
    customTooltip: {
      useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
    },    
  },
  {
    name: "Sit Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    sortable: true,
    hidden: true
  },
  {
    name: "Importe",
    type: "currency",
    id: "monto",
    field: "monto",
    fieldName: "des.PersonalOtroDescuentoImporteVariable",
    sortable: true,
  },
  {
    name: "CUIT Responsable",
    type: "number",
    id: "CUITJ",
    field: "CUITJ",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
  },
  {
    name: "Apellido Nombre Responsable",
    type: "string",
    id: "ApellidoNombreJ",
    field: "ApellidoNombreJ",
    fieldName: "perrel.PersonalCategoriaPersonalId",
    searchComponent:"inpurForPersonalSearch",
    sortable: true,
  },
  {
    name: "ID Descuento",
    field: "descuento",
    type: "number",
    id: "PersonalOtroDescuentoId",
    sortable: true,
    hidden: true
  },
  {
    name: "PersonalIdJ",
    type: "string",
    id: "PersonalIdJ",
    field: "PersonalIdJ",
    fieldName: "perrel.PersonalCategoriaPersonalId",
    sortable: false,
    hidden: true
  },
  {
    name: "ClienteId",
    type: "string",
    id: "ClienteId",
    field: "ClienteId",
    fieldName: "cli.ClienteId",
    hidden: true
  },
  {
    name: "Sucursal",
    type: "string",
    id: "Sucursal",
    field: "Sucursal",
    fieldName: "suc.SucursalId",
    searchComponent:"Sucursal",
    sortable: true,
    hidden: true
  },

];

const findColumnByIndex = (field: string, list: any[]) => {
  return list.find((columna) => columna.field === field);
};

export { listaColumnas, findColumnByIndex };

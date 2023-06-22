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
  },
  {
    name: "Sit Revista",
    type: "string",
    id: "SituacionRevistaDescripcion",
    field: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    sortable: true,
  },
  {
    name: "Importe",
    type: "currency",
    id: "monto",
    field: "monto",
    fieldName: "des.PersonalOtroDescuentoImporteVariable",
    sortable: true,
    formatter: (row, cell, value) => value >0 ? `<a app-down-file title="Comprobante {{ row.PersonalOtroDescuentoMesesAplica }}/{{ row.PersonalOtroDescuentoAnoAplica }}"
    httpUrl="api/impuestos_afip/{{row.PersonalOtroDescuentoAnoAplica}}/{{ row.PersonalOtroDescuentoMesesAplica }}/0/{{row.PersonalId}}"
             ><span class="pl-xs" nz-icon nzType="download"></span></a>`: ``,
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
    sortable: true,
  },
  {
    name: "ID Descuento",
    field: "descuento",
    type: "number",
    id: "PersonalOtroDescuentoId",
    sortable: true,
  },
];

const findColumnByIndex = (field: string, list: any[]) => {
  return list.find((columna) => columna.field === field);
};

export { listaColumnas, findColumnByIndex };

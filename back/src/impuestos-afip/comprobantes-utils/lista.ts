interface Column {
  title: string;
  index: string;
  fieldName: string;
  type: string;
  exported: boolean;
}
const listaColumnas: Column[] = [
  {
    title: "CUIT",
    index: "CUIT",
    fieldName: "cuit2.PersonalCUITCUILCUIT",
    type: "number",
    exported: true,
  },
  {
    title: "Apellido Nombre",
    type: "",
    index: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    exported: true,
  },
  {
    title: "Sit Revista",
    type: "",
    index: "SituacionRevistaDescripcion",
    fieldName: "sit.SituacionRevistaDescripcion",
    exported: true,
  },
  {
    title: "Importe",
    type: "currency",
    index: "monto",
    fieldName: "des.PersonalOtroDescuentoImporteVariable",
    exported: true,
  },
  {
    title: "CUIT Responsable",
    type: "number",
    index: "CUITJ",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    exported: true,
  },
  {
    title: "Apellido Nombre Responsable",
    type: "string",
    index: "ApellidoNombreJ",
    fieldName: "ApellidoNombreJ",
    exported: true,
  },
  {
    title: "ID Descuento",
    fieldName: "descuento",
    type: "number",
    index: "PersonalOtroDescuentoId",
    exported: true,
  },
];

const findColumnByIndex = (index: string, list: Column[]) => {
  return list.find((columna) => columna.index === index);
};

export { listaColumnas, findColumnByIndex };

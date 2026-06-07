/** Una línea de origen: el efecto a mover, su ubicación, cantidad y el efecto relacionado opcional. */
export interface EfectoStockLinea {
  EfectoId: number | null;
  Cantidad: number | null;
  StockId: number | null;
  EfectoIndividualId: number | null;
  Usado: boolean;
  RelacionEfectoId: number | null;
  RelacionStockId: number | null;
  RelacionEfectoIndividualId: number | null;
  //isDelete: boolean;
}

/** Datos del formulario completo: destino (cabecera) + las líneas de origen. */
export interface ParametroformEfectoStock {
  fecha: Date | null;
  tipoDestino: string;
  depositoId: number | null;
  personalId: number | null;
  objetivoId: string | null;
  proveedorId: number | null;
  intermediarioId: number | null;
  observaciones: string;
  efectos: EfectoStockLinea[];
}

/** Crea una línea vacía. */
export const nuevaEfectoLinea = (): EfectoStockLinea => ({
  EfectoId: null, Cantidad: null, StockId: null, EfectoIndividualId: null,
  Usado: false, RelacionEfectoId: null, RelacionStockId: null, RelacionEfectoIndividualId: null,
  //isDelete: false,
});

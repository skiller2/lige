/** Una línea de origen: el efecto a mover, su ubicación, cantidad y el efecto relacionado opcional. */
export interface EfectoStockLinea {
  trackId:string;
  EfectoId: number | null;
  Cantidad: number | null;
  StockId: number | null;
  StockStock: number | null;
  EfectoIndividualId: number | null;
  Usado: boolean;
  RelacionEfectoId: number | null;
  RelacionStockId: number | null;
  RelacionEfectoIndividualId: number | null;
}

/** Datos del formulario completo: destino (cabecera) + las líneas de origen. */
export interface ParametroformEfectoStock {
  fecha: Date | null;
  tipoDestino: string;
  depositoId: number | null;
  personalId: number | null;
  objetivoId: string | null;
  proveedorId: number | null;
  personalIdInter: number | null;
  observaciones: string;
  efectos: EfectoStockLinea[];
}

/** Crea una línea vacía. */
export const nuevaEfectoLinea = (): EfectoStockLinea => ({
  trackId: crypto.randomUUID(),
  EfectoId: null,
  Cantidad: null,
  StockId: null,
  StockStock: null,
  EfectoIndividualId: null,
  Usado: false, 
  RelacionEfectoId: null, 
  RelacionStockId: null, 
  RelacionEfectoIndividualId: null,
});


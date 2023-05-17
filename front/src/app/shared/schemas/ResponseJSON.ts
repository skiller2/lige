export interface ResponseJSON<T> {
  msg: string;
  data: T;
  stamp: Date;
}

export interface DescuentoJSON {
  PersonalId: number;
  CUIT: number;
  ApellidoNombre: string;
  PersonalEstado: string;
  PersonalIdJ: number;
  CUITJ: number;
  ApellidoNombreJ: string;
  monto: null | number;
  PersonalOtroDescuentoAnoAplica: null | number;
  PersonalOtroDescuentoMesesAplica: null | number;
  PersonalOtroDescuentoDescuentoId: null | number;
  clicked?: boolean;
}

export interface ResponseDescuentos {
  RegistrosConComprobantes: number;
  RegistrosSinComprobantes: number;
  Registros: DescuentoJSON[];
}

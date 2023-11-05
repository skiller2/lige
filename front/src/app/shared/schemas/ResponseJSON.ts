export interface ResponseJSON<T> {
  msg: string;
  data: T;
  stamp: Date;
  ms: number
}

export interface DescuentoJSON {
  PersonalId: number;
  CUIT: number;
  ApellidoNombre: string;
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

export interface ResponseNameFromId {
  personalId: number;
  cuit: number;
  apellido: string;
  nombre: string;
}

export interface Objetivo {
  SucursalId: number;
  SucursalDescripcion: string;
  PersonalId: number;
  PersonalApellido: string;
  PersonalNombre: string;
  ObjetivoDescripcion: string;
  ObjetivoId: number;
  ClienteId: number;
  ClienteElementoDependienteId: number | null;
  ClienteElementoDependienteDomicilioDomCalle: string | null;
  ClienteElementoDependienteDomicilioDomNro: number | null;
}

export interface ObjetivoInfo {
  objetivoId: number;
  clienteId: number;
  elementoDependienteId: number;
  descripcion: string;
  fullName: string;
}

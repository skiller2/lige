export interface ResponseJSON<T> {
  msg: string;
  data: T;
  stamp: Date;
}

export interface DescuentoJSON {
  PersonalId: number;
  monto: number;
  CUIT: number;
  ApellidoNombre: string;
  PersonalIdJ: number;
  CUITJ: number;
  ApellidoNombreJ: string;
}

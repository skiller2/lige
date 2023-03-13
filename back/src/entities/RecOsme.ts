import { Column, Entity, Index } from "typeorm";

@Index("PK_REC_OSME_2__15", ["cara_5", "nroOrden", "recId"], { unique: true })
@Entity("REC_OSME", { schema: "dbo" })
export class RecOsme {
  @Column("int", { primary: true, name: "REC_ID" })
  recId: number;

  @Column("int", { name: "Anio", nullable: true })
  anio: number | null;

  @Column("int", { name: "Mes", nullable: true })
  mes: number | null;

  @Column("int", { primary: true, name: "CARA_5" })
  cara_5: number;

  @Column("int", { primary: true, name: "NRO_ORDEN" })
  nroOrden: number;

  @Column("varchar", { name: "SERIE", nullable: true, length: 2 })
  serie: string | null;

  @Column("int", { name: "RECETA", nullable: true })
  receta: number | null;

  @Column("datetime", { name: "FECH_EMI", nullable: true })
  fechEmi: Date | null;

  @Column("int", { name: "AFILIADO", nullable: true })
  afiliado: number | null;

  @Column("int", { name: "CAT_AFI", nullable: true })
  catAfi: number | null;

  @Column("int", { name: "EDAD_AFI", nullable: true })
  edadAfi: number | null;

  @Column("datetime", { name: "FECH_DIS", nullable: true })
  fechDis: Date | null;

  @Column("int", { name: "COD_FARMA", nullable: true })
  codFarma: number | null;

  @Column("int", { name: "TRO_1", nullable: true, default: () => "0" })
  tro_1: number | null;

  @Column("int", { name: "DIG_1", nullable: true })
  dig_1: number | null;

  @Column("smallint", { name: "CANPRES_1", nullable: true, default: () => "0" })
  canpres_1: number | null;

  @Column("smallint", { name: "CANENTR_1", nullable: true, default: () => "0" })
  canentr_1: number | null;

  @Column("smallint", { name: "CANTROQ_1", nullable: true, default: () => "0" })
  cantroq_1: number | null;

  @Column("money", { name: "PRECIO_1", nullable: true, default: () => "0" })
  precio_1: number | null;

  @Column("int", { name: "TRO_2", nullable: true, default: () => "0" })
  tro_2: number | null;

  @Column("smallint", { name: "DIG_2", nullable: true })
  dig_2: number | null;

  @Column("smallint", { name: "CANPRES_2", nullable: true, default: () => "0" })
  canpres_2: number | null;

  @Column("smallint", { name: "CANENTR_2", nullable: true, default: () => "0" })
  canentr_2: number | null;

  @Column("smallint", { name: "CANTROQ_2", nullable: true, default: () => "0" })
  cantroq_2: number | null;

  @Column("money", { name: "PRECIO_2", nullable: true, default: () => "0" })
  precio_2: number | null;

  @Column("int", { name: "TRO_3", nullable: true, default: () => "0" })
  tro_3: number | null;

  @Column("int", { name: "DIG_3", nullable: true })
  dig_3: number | null;

  @Column("smallint", { name: "CANPRES_3", nullable: true, default: () => "0" })
  canpres_3: number | null;

  @Column("smallint", { name: "CANENTR_3", nullable: true, default: () => "0" })
  canentr_3: number | null;

  @Column("smallint", { name: "CANTROQ_3", nullable: true, default: () => "0" })
  cantroq_3: number | null;

  @Column("money", { name: "PRECIO_3", nullable: true, default: () => "0" })
  precio_3: number | null;

  @Column("money", { name: "TOT_REC", nullable: true })
  totRec: number | null;

  @Column("money", { name: "TOT_AC", nullable: true })
  totAc: number | null;

  @Column("int", { name: "MATRICULA", nullable: true })
  matricula: number | null;

  @Column("int", { name: "ERROR_1", nullable: true })
  error_1: number | null;

  @Column("int", { name: "ERROR_2", nullable: true })
  error_2: number | null;

  @Column("int", { name: "ERROR_3", nullable: true })
  error_3: number | null;

  @Column("int", { name: "ERROR_4", nullable: true })
  error_4: number | null;

  @Column("int", { name: "ERROR_5", nullable: true })
  error_5: number | null;

  @Column("int", { name: "ERROR_6", nullable: true })
  error_6: number | null;

  @Column("int", { name: "ERROR_7", nullable: true })
  error_7: number | null;

  @Column("int", { name: "ERROR_8", nullable: true })
  error_8: number | null;

  @Column("int", { name: "ERROR_9", nullable: true })
  error_9: number | null;

  @Column("int", { name: "ERROR_10", nullable: true })
  error_10: number | null;

  @Column("int", { name: "PLANS", nullable: true })
  plans: number | null;

  @Column("money", { name: "CALC_TOT", nullable: true })
  calcTot: number | null;

  @Column("money", { name: "CALC_AC", nullable: true })
  calcAc: number | null;

  @Column("money", { name: "CAJA", nullable: true })
  caja: number | null;

  @Column("float", { name: "SOBRE", nullable: true, precision: 53 })
  sobre: number | null;

  @Column("float", { name: "TOT_APA", nullable: true, precision: 53 })
  totApa: number | null;

  @Column("float", { name: "TOT_APAACA", nullable: true, precision: 53 })
  totApaaca: number | null;

  @Column("int", { name: "COD_COLE", nullable: true })
  codCole: number | null;

  @Column("int", { name: "COD_LOCA", nullable: true })
  codLoca: number | null;

  @Column("int", { name: "PORC_1", nullable: true, default: () => "0" })
  porc_1: number | null;

  @Column("int", { name: "PORC_2", nullable: true, default: () => "0" })
  porc_2: number | null;

  @Column("int", { name: "PORC_3", nullable: true, default: () => "0" })
  porc_3: number | null;

  @Column("smallint", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "TIEMPO", nullable: true })
  tiempo: Date | null;
}

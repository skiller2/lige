import { Column, Entity, Index } from "typeorm";

@Index(
  "Farmacia_y_Recibo_Repetidos",
  ["anio", "mes", "clase", "quiosem", "plans", "codFarma", "recibo"],
  { unique: true }
)
@Index("PK_CAROSVAR", ["coduni"], { unique: true })
@Index("PorCodFarma", ["codFarma"], {})
@Entity("CAROSVAR", { schema: "dbo" })
export class Carosvar {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "ANIO", nullable: true, unique: true })
  anio: number | null;

  @Column("smallint", { name: "MES", nullable: true, unique: true })
  mes: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, unique: true, length: 1 })
  clase: string | null;

  @Column("smallint", { name: "QUIOSEM", nullable: true, unique: true })
  quiosem: number | null;

  @Column("int", { name: "COD_FARMA", nullable: true, unique: true })
  codFarma: number | null;

  @Column("int", { name: "NROCOLE", nullable: true })
  nrocole: number | null;

  @Column("int", { name: "RECIBO", nullable: true, unique: true })
  recibo: number | null;

  @Column("smallint", { name: "PLANS", nullable: true, unique: true })
  plans: number | null;

  @Column("int", { name: "CAN_LOTES", nullable: true, default: () => "0" })
  canLotes: number | null;

  @Column("int", { name: "CAN_RECETAS", nullable: true })
  canRecetas: number | null;

  @Column("money", { name: "TOT_FAC", nullable: true })
  totFac: number | null;

  @Column("money", { name: "TOT_AC", nullable: true })
  totAc: number | null;

  @Column("money", { name: "BONIF", nullable: true, default: () => "0" })
  bonif: number | null;

  @Column("money", { name: "A_REINT", nullable: true })
  aReint: number | null;

  @Column("datetime", { name: "TIEMPO", nullable: true })
  tiempo: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CAN_UNIDADES", nullable: true, default: () => "0" })
  canUnidades: number | null;

  @Column("int", { name: "CAN_PRODUCTOS", nullable: true, default: () => "0" })
  canProductos: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 20 })
  nropami: string | null;

  @Column("money", { name: "FON_FIDUC", nullable: true })
  fonFiduc: number | null;
}

import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("paravalida", ["codliq", "nrofar"], {})
@Index("PK___1__14", ["cod"], { unique: true })
@Index("PORCODLIQ", ["codliq"], {})
@Index(
  "PorPeriodo",
  ["anio", "mes", "clase", "quiosem", "codooss", "codliq", "nrofar"],
  {}
)
@Entity("LIQUIDACIONES", { schema: "dbo" })
export class Liquidaciones {
  @PrimaryGeneratedColumn({ type: "int", name: "COD" })
  cod: number;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("smallint", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("int", { name: "NROFAR", nullable: true, default: () => "0" })
  nrofar: number | null;

  @Column("int", { name: "RECIBO", nullable: true, default: () => "0" })
  recibo: number | null;

  @Column("int", { name: "CAN_RECETAS", nullable: true, default: () => "0" })
  canRecetas: number | null;

  @Column("int", { name: "CAN_TROQ", nullable: true, default: () => "0" })
  canTroq: number | null;

  @Column("int", { name: "CAN_PROD", nullable: true, default: () => "0" })
  canProd: number | null;

  @Column("money", { name: "TOT_FAC", nullable: true, default: () => "0" })
  totFac: number | null;

  @Column("money", { name: "TOT_AC", nullable: true, default: () => "0" })
  totAc: number | null;

  @Column("money", { name: "BONIFIC", nullable: true, default: () => "0" })
  bonific: number | null;

  @Column("int", { name: "TOT_LOTES", nullable: true, default: () => "0" })
  totLotes: number | null;

  @Column("money", { name: "TOT_REIN", nullable: true, default: () => "0" })
  totRein: number | null;

  @Column("money", { name: "COMISION", nullable: true, default: () => "0" })
  comision: number | null;

  @Column("int", { name: "OPER", nullable: true, default: () => "0" })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "EXECUT", nullable: true, default: () => "0" })
  execut: number | null;

  @Column("money", { name: "NOTACRED", nullable: true, default: () => "0" })
  notacred: number | null;

  @Column("datetime", { name: "FECPRE", nullable: true })
  fecpre: Date | null;

  @Column("varchar", {
    name: "NROPAMI",
    nullable: true,
    length: 10,
    default: () => "0",
  })
  nropami: string | null;

  @Column("money", { name: "FON_FIDUC", nullable: true })
  fonFiduc: number | null;
}

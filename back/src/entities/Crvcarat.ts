import { Column, Entity, Index } from "typeorm";

@Index("PK_CRVCARAT_1__15", ["codcar"], { unique: true })
@Entity("CRVCARAT", { schema: "dbo" })
export class Crvcarat {
  @Column("int", { primary: true, name: "CODCAR" })
  codcar: number;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("int", { name: "CANTREC", nullable: true })
  cantrec: number | null;

  @Column("money", { name: "TOTFAC", nullable: true })
  totfac: number | null;

  @Column("money", { name: "TOTAC", nullable: true })
  totac: number | null;

  @Column("money", { name: "TOTBENEF", nullable: true })
  totbenef: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("char", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 20 })
  nropami: string | null;

  @Column("int", { name: "COBER", nullable: true })
  cober: number | null;

  @Column("money", { name: "BONIF", nullable: true })
  bonif: number | null;

  @Column("money", { name: "TOTREIN", nullable: true })
  totrein: number | null;
}

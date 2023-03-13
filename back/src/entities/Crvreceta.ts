import { Column, Entity, Index } from "typeorm";

@Index("PK_CRVRECETA_1__23", ["coduni"], { unique: true })
@Entity("CRVRECETA", { schema: "dbo" })
export class Crvreceta {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODCAR", nullable: true })
  codcar: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("datetime", { name: "PERDES", nullable: true })
  perdes: Date | null;

  @Column("datetime", { name: "PERHAS", nullable: true })
  perhas: Date | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 12 })
  nropami: string | null;

  @Column("int", { name: "CODDRO", nullable: true })
  coddro: number | null;

  @Column("datetime", { name: "FECEMI", nullable: true })
  fecemi: Date | null;

  @Column("datetime", { name: "FECEXP", nullable: true })
  fecexp: Date | null;

  @Column("varchar", { name: "NROREC", nullable: true, length: 10 })
  nrorec: string | null;

  @Column("int", { name: "NROORD", nullable: true })
  nroord: number | null;

  @Column("varchar", { name: "NROBEN", nullable: true, length: 40 })
  nroben: string | null;

  @Column("char", { name: "NROBENF", nullable: true, length: 1 })
  nrobenf: string | null;

  @Column("smallint", { name: "SEXO", nullable: true })
  sexo: number | null;

  @Column("smallint", { name: "EDAD", nullable: true })
  edad: number | null;

  @Column("varchar", { name: "MATMED", nullable: true, length: 40 })
  matmed: string | null;

  @Column("char", { name: "MATMEDF", nullable: true, length: 1 })
  matmedf: string | null;

  @Column("varchar", { name: "DIAGPRI", nullable: true, length: 40 })
  diagpri: string | null;

  @Column("varchar", { name: "DIAGSEC", nullable: true, length: 40 })
  diagsec: string | null;

  @Column("smallint", { name: "TRATPRO", nullable: true })
  tratpro: number | null;

  @Column("smallint", { name: "RECAUTOR", nullable: true })
  recautor: number | null;

  @Column("smallint", { name: "RECOBSER", nullable: true })
  recobser: number | null;

  @Column("varchar", { name: "CODERRS", nullable: true, length: 40 })
  coderrs: string | null;

  @Column("money", { name: "TOTREC", nullable: true })
  totrec: number | null;

  @Column("money", { name: "AC", nullable: true })
  ac: number | null;

  @Column("money", { name: "BENEF", nullable: true })
  benef: number | null;

  @Column("datetime", { name: "TIEMPO", nullable: true })
  tiempo: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_CRVCONFIG_1__10", ["codooss"], { unique: true })
@Entity("CRVCONFIG", { schema: "dbo" })
export class Crvconfig {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("char", { name: "NROORD", nullable: true, length: 1 })
  nroord: string | null;

  @Column("char", { name: "NROREC", nullable: true, length: 1 })
  nrorec: string | null;

  @Column("char", { name: "FECEMI", nullable: true, length: 1 })
  fecemi: string | null;

  @Column("char", { name: "DECEXP", nullable: true, length: 1 })
  decexp: string | null;

  @Column("char", { name: "PERDES", nullable: true, length: 1 })
  perdes: string | null;

  @Column("char", { name: "PERHAS", nullable: true, length: 1 })
  perhas: string | null;

  @Column("char", { name: "CODDRO", nullable: true, length: 1 })
  coddro: string | null;

  @Column("char", { name: "NROBEN", nullable: true, length: 1 })
  nroben: string | null;

  @Column("char", { name: "SEXO", nullable: true, length: 1 })
  sexo: string | null;

  @Column("char", { name: "EDAD", nullable: true, length: 1 })
  edad: string | null;

  @Column("char", { name: "MATMED", nullable: true, length: 1 })
  matmed: string | null;

  @Column("char", { name: "DIAGPRI", nullable: true, length: 1 })
  diagpri: string | null;

  @Column("char", { name: "DIAGSEC", nullable: true, length: 1 })
  diagsec: string | null;

  @Column("char", { name: "TRATPRO", nullable: true, length: 1 })
  tratpro: string | null;

  @Column("char", { name: "RECAUTOR", nullable: true, length: 1 })
  recautor: string | null;

  @Column("char", { name: "RECOBSER", nullable: true, length: 1 })
  recobser: string | null;

  @Column("char", { name: "TOTREC", nullable: true, length: 1 })
  totrec: string | null;

  @Column("char", { name: "AC", nullable: true, length: 1 })
  ac: string | null;

  @Column("char", { name: "BENEF", nullable: true, length: 1 })
  benef: string | null;

  @Column("char", { name: "TROQUEL", nullable: true, length: 1 })
  troquel: string | null;

  @Column("char", { name: "RCANPRE", nullable: true, length: 1 })
  rcanpre: string | null;

  @Column("char", { name: "RCANENT", nullable: true, length: 1 })
  rcanent: string | null;

  @Column("char", { name: "RPREUNI", nullable: true, length: 1 })
  rpreuni: string | null;

  @Column("char", { name: "RTOTAL", nullable: true, length: 1 })
  rtotal: string | null;

  @Column("char", { name: "RAC", nullable: true, length: 1 })
  rac: string | null;

  @Column("char", { name: "RCOBERT", nullable: true, length: 1 })
  rcobert: string | null;

  @Column("char", { name: "PBENEF", nullable: true, length: 1 })
  pbenef: string | null;

  @Column("char", { name: "PMEDIC", nullable: true, length: 1 })
  pmedic: string | null;

  @Column("char", { name: "PTROQUE", nullable: true, length: 1 })
  ptroque: string | null;

  @Column("char", { name: "PCOBERT", nullable: true, length: 1 })
  pcobert: string | null;

  @Column("char", { name: "RBENEF", nullable: true, length: 1 })
  rbenef: string | null;

  @Column("varchar", { name: "ERRORES", nullable: true, length: 100 })
  errores: string | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___10__10", ["coduni"], { unique: true })
@Entity("LISPAGOS", { schema: "dbo" })
export class Lispagos {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODGRUPO", nullable: true })
  codgrupo: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "NROCHE", nullable: true })
  nroche: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODBCOCU", nullable: true })
  codbcocu: number | null;

  @Column("datetime", { name: "FECENT", nullable: true })
  fecent: Date | null;

  @Column("varchar", { name: "ORDENCH", nullable: true, length: 100 })
  ordench: string | null;

  @Column("varchar", { name: "DPA_COD", nullable: true, length: 10 })
  dpaCod: string | null;

  @Column("int", { name: "IFA_DEP_MISMO_BANCO", nullable: true })
  ifaDepMismoBanco: number | null;

  @Column("varchar", { name: "MFA_DEP_CBU", nullable: true, length: 50 })
  mfaDepCbu: string | null;
}

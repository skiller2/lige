import { Column, Entity, Index } from "typeorm";

@Index("PK___7__13", ["codext"], { unique: true })
@Entity("EXTRABNCPER", { schema: "dbo" })
export class Extrabncper {
  @Column("int", { primary: true, name: "CODEXT" })
  codext: number;

  @Column("int", { name: "CODBCOCU" })
  codbcocu: number;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("datetime", { name: "FECDES" })
  fecdes: Date;

  @Column("datetime", { name: "FECHAS" })
  fechas: Date;

  @Column("int", { name: "OPER" })
  oper: number;

  @Column("datetime", { name: "STAMPA" })
  stampa: Date;

  @Column("money", { name: "SALDOINI", nullable: true, default: () => "0" })
  saldoini: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___6__13", ["codbcocu", "cod"], { unique: true })
@Entity("EXTRABANCA", { schema: "dbo" })
export class Extrabanca {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("int", { name: "CODEXT" })
  codext: number;

  @Column("int", { primary: true, name: "CODBCOCU" })
  codbcocu: number;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("varchar", { name: "CONCEPTO", nullable: true, length: 100 })
  concepto: string | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "HOJA", nullable: true })
  hoja: number | null;

  @Column("int", { name: "SIGNO" })
  signo: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "NROCHE", nullable: true })
  nroche: number | null;

  @Column("int", { name: "CODTRAN", nullable: true, default: () => "0" })
  codtran: number | null;

  @Column("int", { name: "MARCA", nullable: true, default: () => "0" })
  marca: number | null;

  @Column("int", { name: "CONCI", nullable: true, default: () => "0" })
  conci: number | null;
}

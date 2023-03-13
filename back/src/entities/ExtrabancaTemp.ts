import { Column, Entity, Index } from "typeorm";

@Index("PK_EXTRABANCA_TEMP", ["cod"], { unique: true })
@Entity("EXTRABANCA_TEMP", { schema: "dbo" })
export class ExtrabancaTemp {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("int", { name: "CODEXT" })
  codext: number;

  @Column("int", { name: "CODBCOCU" })
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

  @Column("int", { name: "CODTRAN", nullable: true })
  codtran: number | null;

  @Column("int", { name: "MARCA", nullable: true })
  marca: number | null;

  @Column("int", { name: "CONCI", nullable: true })
  conci: number | null;
}

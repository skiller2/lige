import { Column, Entity, Index } from "typeorm";

@Index("PK___1__21", ["coduni"], { unique: true })
@Entity("TEMPCHEQUE", { schema: "dbo" })
export class Tempcheque {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR", default: () => "0" })
  nrofar: number;

  @Column("varchar", { name: "NOMBRE", length: 100 })
  nombre: string;

  @Column("int", { name: "DIA", nullable: true, default: () => "1" })
  dia: number | null;

  @Column("int", { name: "MES", nullable: true, default: () => "1" })
  mes: number | null;

  @Column("int", { name: "ANIO", nullable: true, default: () => "1996" })
  anio: number | null;

  @Column("int", { name: "FORDENCH1", nullable: true })
  fordench1: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("smallint", { name: "debit", nullable: true, default: () => "0" })
  debit: number | null;

  @Column("int", { name: "NROCHE", nullable: true })
  nroche: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("varchar", { name: "FORDENCH", nullable: true, length: 100 })
  fordench: string | null;

  @Column("int", { name: "CODBCOCU", nullable: true })
  codbcocu: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "TIPO", nullable: true })
  tipo: number | null;
}

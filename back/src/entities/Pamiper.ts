import { Column, Entity, Index } from "typeorm";

@Index("PK___4__10", ["codper"], { unique: true })
@Entity("PAMIPER", { schema: "dbo" })
export class Pamiper {
  @Column("int", { primary: true, name: "CODPER" })
  codper: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 50 })
  observ: string | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "EXECUT", nullable: true, default: () => "0" })
  execut: number | null;

  @Column("int", { name: "CODLIQ", nullable: true, default: () => "0" })
  codliq: number | null;
}

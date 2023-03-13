import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPPERIODO_1__16", ["codper"], { unique: true })
@Entity("FBPPERIODO", { schema: "dbo" })
export class Fbpperiodo {
  @Column("int", { primary: true, name: "CODPER" })
  codper: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "QUINC", nullable: true })
  quinc: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "TRABA", nullable: true })
  traba: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 100 })
  observ: string | null;

  @Column("int", { name: "CODLABO", nullable: true })
  codlabo: number | null;
}

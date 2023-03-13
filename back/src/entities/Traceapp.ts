import { Column, Entity, Index } from "typeorm";

@Index("PK__traceapp__4DC991C5", ["codUni"], { unique: true })
@Entity("TRACEAPP", { schema: "dbo" })
export class Traceapp {
  @Column("int", { primary: true, name: "CodUni" })
  codUni: number;

  @Column("varchar", { name: "Estacion", nullable: true, length: 60 })
  estacion: string | null;

  @Column("int", { name: "Oper", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "FecHorIni", nullable: true })
  fecHorIni: Date | null;

  @Column("datetime", { name: "FecHorFin", nullable: true })
  fecHorFin: Date | null;

  @Column("varchar", { name: "Aplicacion", nullable: true, length: 60 })
  aplicacion: string | null;

  @Column("varchar", { name: "Observ", nullable: true, length: 60 })
  observ: string | null;
}

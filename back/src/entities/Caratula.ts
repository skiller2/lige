import { Column, Entity, Index } from "typeorm";

@Index("Caratula_Repetida", ["anio", "mes", "codFarma", "plans", "tipo"], {
  unique: true,
})
@Index("PK_CARATULA", ["cara_5"], { unique: true })
@Index("PorTodo", ["anio", "mes", "codFarma", "cara_5"], {})
@Entity("CARATULA", { schema: "dbo" })
export class Caratula {
  @Column("int", { primary: true, name: "CARA_5" })
  cara_5: number;

  @Column("int", { name: "ANIO", nullable: true, unique: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true, unique: true })
  mes: number | null;

  @Column("int", { name: "COD_FARMA", nullable: true, unique: true })
  codFarma: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("smallint", { name: "PLANS", nullable: true, unique: true })
  plans: number | null;

  @Column("money", { name: "MTO_TOTAL", nullable: true })
  mtoTotal: number | null;

  @Column("money", { name: "MTO_AC", nullable: true })
  mtoAc: number | null;

  @Column("int", { name: "CAN_REC", nullable: true })
  canRec: number | null;

  @Column("smallint", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "CONVENIO", nullable: true, length: 10 })
  convenio: string | null;

  @Column("int", { name: "RECIBO", nullable: true })
  recibo: number | null;

  @Column("int", {
    name: "TIPO",
    nullable: true,
    unique: true,
    default: () => "0",
  })
  tipo: number | null;
}

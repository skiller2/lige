import { Column, Entity, Index } from "typeorm";

@Index("PK___4__22COL", ["id"], { unique: true })
@Entity("DEBRENDICOL", { schema: "dbo" })
export class Debrendicol {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

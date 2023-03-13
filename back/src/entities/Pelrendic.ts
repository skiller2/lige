import { Column, Entity, Index } from "typeorm";

@Index("PK_PELRENDIC_1__28", ["id"], { unique: true })
@Entity("PELRENDIC", { schema: "dbo" })
export class Pelrendic {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

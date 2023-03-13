import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPPADRDES_1__27", ["codpad"], { unique: true })
@Entity("FBPPADRDES", { schema: "dbo" })
export class Fbppadrdes {
  @Column("int", { primary: true, name: "CODPAD" })
  codpad: number;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 100 })
  observ: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

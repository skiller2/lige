import { Column, Entity, Index } from "typeorm";

@Index("PK_PELCOSTO_1__13", ["id"], { unique: true })
@Entity("PELCOSTO", { schema: "dbo" })
export class Pelcosto {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("money", { name: "COSTO", nullable: true, default: () => "0" })
  costo: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

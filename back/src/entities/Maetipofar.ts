import { Column, Entity, Index } from "typeorm";

@Index("PK_MAETIPOFAR_2__10", ["tipofar"], { unique: true })
@Entity("MAETIPOFAR", { schema: "dbo" })
export class Maetipofar {
  @Column("int", { primary: true, name: "TIPOFAR" })
  tipofar: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;
}

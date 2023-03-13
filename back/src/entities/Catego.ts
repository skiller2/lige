import { Column, Entity, Index } from "typeorm";

@Index("PK_CATEGO_1__14", ["codigo"], { unique: true })
@Entity("CATEGO", { schema: "dbo" })
export class Catego {
  @Column("int", { primary: true, name: "CODIGO" })
  codigo: number;

  @Column("varchar", { name: "DETALLE", length: 10 })
  detalle: string;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

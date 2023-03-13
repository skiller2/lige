import { Column, Entity, Index } from "typeorm";

@Index("PK_OBSERDESCRI_1__11", ["cod"], { unique: true })
@Entity("OBSERDESCRI", { schema: "dbo" })
export class Obserdescri {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("varchar", { name: "DESCRI", nullable: true, length: 50 })
  descri: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

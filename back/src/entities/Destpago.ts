import { Column, Entity, Index } from "typeorm";

@Index("PK_DESTPAGO", ["dpaCod"], { unique: true })
@Entity("DESTPAGO", { schema: "dbo" })
export class Destpago {
  @Column("varchar", { primary: true, name: "DPA_COD", length: 3 })
  dpaCod: string;

  @Column("varchar", { name: "DPA_DESCRIP", nullable: true, length: 50 })
  dpaDescrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

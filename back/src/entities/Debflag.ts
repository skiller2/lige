import { Column, Entity, Index } from "typeorm";

@Index("PK_DEBFLAG_1__10", ["flag"], { unique: true })
@Entity("DEBFLAG", { schema: "dbo" })
export class Debflag {
  @Column("int", { primary: true, name: "FLAG" })
  flag: number;

  @Column("varchar", { name: "DESCRI", nullable: true, length: 50 })
  descri: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

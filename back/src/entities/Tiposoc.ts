import { Column, Entity, Index } from "typeorm";

@Index("PK___4__12", ["cod"], { unique: true })
@Entity("TIPOSOC", { schema: "dbo" })
export class Tiposoc {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "DESCRIPLONG", nullable: true, length: 50 })
  descriplong: string | null;
}

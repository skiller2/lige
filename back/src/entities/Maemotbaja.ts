import { Column, Entity, Index } from "typeorm";

@Index("PK___1__18", ["codbaja"], { unique: true })
@Entity("MAEMOTBAJA", { schema: "dbo" })
export class Maemotbaja {
  @Column("int", { primary: true, name: "CODBAJA" })
  codbaja: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

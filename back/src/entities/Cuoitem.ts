import { Column, Entity, Index } from "typeorm";

@Index("PK___3__10", ["coditem"], { unique: true })
@Entity("CUOITEM", { schema: "dbo" })
export class Cuoitem {
  @Column("int", { primary: true, name: "CODITEM" })
  coditem: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "IMPUTA", nullable: true, length: 50 })
  imputa: string | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___3__21", ["coduni"], { unique: true })
@Entity("TESIMPUTA", { schema: "dbo" })
export class Tesimputa {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "FOB", nullable: true })
  fob: number | null;

  @Column("int", { name: "CODITEM", nullable: true })
  coditem: number | null;

  @Column("varchar", { name: "IMPUTDES", nullable: true, length: 50 })
  imputdes: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

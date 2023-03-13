import { Column, Entity, Index } from "typeorm";

@Index("PK___1__42", ["nrorec"], { unique: true })
@Entity("RECIBOST", { schema: "dbo" })
export class Recibost {
  @Column("int", { primary: true, name: "NROREC" })
  nrorec: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "BORRAR", nullable: true })
  borrar: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "CODCOB", nullable: true })
  codcob: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___1__31", ["nrorec"], { unique: true })
@Entity("RECIBOSA", { schema: "dbo" })
export class Recibosa {
  @Column("int", { primary: true, name: "NROREC" })
  nrorec: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "borrar", nullable: true })
  borrar: number | null;

  @Column("int", { name: "PERCOB", nullable: true })
  percob: number | null;

  @Column("int", { name: "CODCOB", nullable: true })
  codcob: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;
}

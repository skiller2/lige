import { Column, Entity, Index } from "typeorm";

@Index("PK___14__10", ["coduni"], { unique: true })
@Entity("COBDISTRIB", { schema: "dbo" })
export class Cobdistrib {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("int", { name: "CODCOB", nullable: true })
  codcob: number | null;

  @Column("int", { name: "CANDIR", nullable: true })
  candir: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

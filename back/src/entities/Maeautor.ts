import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEAUTOR_1__21", ["coduni"], { unique: true })
@Index("PorTodo", ["nrofar", "apelnomb", "coduni"], {})
@Entity("MAEAUTOR", { schema: "dbo" })
export class Maeautor {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR" })
  nrofar: number;

  @Column("varchar", { name: "APELNOMB", nullable: true, length: 50 })
  apelnomb: string | null;

  @Column("int", { name: "TIPODOC", nullable: true })
  tipodoc: number | null;

  @Column("varchar", { name: "NRODOC", nullable: true, length: 20 })
  nrodoc: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;
}

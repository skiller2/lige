import { Column, Entity, Index } from "typeorm";

@Index("PK___9__10", ["coduni"], { unique: true })
@Entity("AJUSTEH", { schema: "dbo" })
export class Ajusteh {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODAJU", nullable: true })
  codaju: number | null;

  @Column("money", { name: "AJU_AC", nullable: true, default: () => "0" })
  ajuAc: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 10 })
  nropami: string | null;
}

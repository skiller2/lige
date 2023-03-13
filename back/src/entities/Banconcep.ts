import { Column, Entity, Index } from "typeorm";

@Index("PK___4__13", ["codcon"], { unique: true })
@Entity("BANCONCEP", { schema: "dbo" })
export class Banconcep {
  @Column("varchar", { primary: true, name: "CODCON", length: 10 })
  codcon: string;

  @Column("varchar", { name: "DECRIPCION", nullable: true, length: 100 })
  decripcion: string | null;

  @Column("int", { name: "SIGNO" })
  signo: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

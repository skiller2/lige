import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEBANCOCUEN_1__10", ["codbcocu"], { unique: true })
@Entity("MAEBANCOCUEN", { schema: "dbo" })
export class Maebancocuen {
  @Column("int", { primary: true, name: "CODBCOCU" })
  codbcocu: number;

  @Column("int", { name: "CODBAN" })
  codban: number;

  @Column("varchar", { name: "NROCUEN", length: 100 })
  nrocuen: string;

  @Column("datetime", { name: "FALTA" })
  falta: Date;

  @Column("datetime", { name: "FBAJA", nullable: true })
  fbaja: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

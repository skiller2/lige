import { Column, Entity, Index } from "typeorm";

@Index("PK_PROFES_1__12", ["codpro"], { unique: true })
@Entity("PROFES", { schema: "dbo" })
export class Profes {
  @Column("int", { primary: true, name: "CODPRO" })
  codpro: number;

  @Column("varchar", { name: "DETPRO", nullable: true, length: 15 })
  detpro: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

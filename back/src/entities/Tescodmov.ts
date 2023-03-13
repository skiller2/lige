import { Column, Entity, Index } from "typeorm";

@Index("PK_TESCODMOV_1__20", ["codmov"], { unique: true })
@Entity("TESCODMOV", { schema: "dbo" })
export class Tescodmov {
  @Column("int", { primary: true, name: "CODMOV" })
  codmov: number;

  @Column("varchar", { name: "DESCRIL", nullable: true, length: 255 })
  descril: string | null;

  @Column("varchar", { name: "DESCRIS", nullable: true, length: 8 })
  descris: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "STAMPA1", nullable: true })
  stampa1: number | null;

  @Column("varchar", { name: "IMPUTA", nullable: true, length: 255 })
  imputa: string | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_RECISUCUR_2__18", ["codsucu"], { unique: true })
@Entity("RECISUCUR", { schema: "dbo" })
export class Recisucur {
  @Column("int", { primary: true, name: "CODSUCU" })
  codsucu: number;

  @Column("int", { name: "NROREC", nullable: true, default: () => "0" })
  nrorec: number | null;

  @Column("varchar", { name: "DESCRI", nullable: true, length: 50 })
  descri: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "MAXPEND", nullable: true, default: () => "(-1)" })
  maxpend: number | null;
}

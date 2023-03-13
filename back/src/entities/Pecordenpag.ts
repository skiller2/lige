import { Column, Entity, Index } from "typeorm";

@Index("PK___18__10", ["nroord"], { unique: true })
@Entity("PECORDENPAG", { schema: "dbo" })
export class Pecordenpag {
  @Column("int", { primary: true, name: "NROORD" })
  nroord: number;

  @Column("int", { name: "CODPEC", nullable: true })
  codpec: number | null;

  @Column("datetime", { name: "FECORD", nullable: true })
  fecord: Date | null;

  @Column("int", { name: "NROREC", nullable: true })
  nrorec: number | null;

  @Column("datetime", { name: "FECREC", nullable: true })
  fecrec: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;
}

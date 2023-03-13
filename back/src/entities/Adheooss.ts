import { Column, Entity, Index } from "typeorm";

@Index("PK___5__10", ["coduni"], { unique: true })
@Index("UQ_ADHEOOSS_2__10", ["codooss", "nrofar"], { unique: true })
@Entity("ADHEOOSS", { schema: "dbo" })
export class Adheooss {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR", unique: true })
  nrofar: number;

  @Column("int", { name: "CODOOSS", unique: true })
  codooss: number;

  @Column("datetime", { name: "FECALTA", nullable: true })
  fecalta: Date | null;

  @Column("varchar", { name: "NROFAROOSS", nullable: true, length: 30 })
  nrofarooss: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "FECBAJA", nullable: true })
  fecbaja: Date | null;
}

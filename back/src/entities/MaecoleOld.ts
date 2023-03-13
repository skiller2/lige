import { Column, Entity, Index } from "typeorm";

@Index("PK___6__10", ["coduni"], { unique: true })
@Entity("MAECOLE_OLD", { schema: "dbo" })
export class MaecoleOld {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROCOL" })
  nrocol: number;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "NROFARDEB", nullable: true })
  nrofardeb: number | null;

  @Column("int", { name: "TIPODEB", nullable: true })
  tipodeb: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "fecbaja", nullable: true })
  fecbaja: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___2__14", ["coduni"], { unique: true })
@Index("PORNROCOLNROFAR", ["nrocol", "nrofar"], {})
@Index("PORNROFARNROCOL", ["nrofar", "nrocol"], {})
@Index("UQ___3__14", ["nrocol", "nrofar"], { unique: true })
@Entity("MAERELA", { schema: "dbo" })
export class Maerela {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR", unique: true })
  nrofar: number;

  @Column("int", { name: "NROCOL", unique: true })
  nrocol: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

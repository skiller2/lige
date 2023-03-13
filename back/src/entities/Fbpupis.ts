import { Column, Entity, Index } from "typeorm";

@Index("PK___1__47", ["codupi"], { unique: true })
@Entity("FBPUPIS", { schema: "dbo" })
export class Fbpupis {
  @Column("int", { primary: true, name: "CODUPI", default: () => "0" })
  codupi: number;

  @Column("int", { name: "CODOOSS", nullable: true, default: () => "0" })
  codooss: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CANT", nullable: true })
  cant: number | null;

  @Column("int", { name: "CODPAD", nullable: true })
  codpad: number | null;
}

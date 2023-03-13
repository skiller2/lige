import { Column, Entity, Index } from "typeorm";

@Index("PK___20__10", ["codooss", "nroben"], { unique: true })
@Entity("CRVPADBENEF", { schema: "dbo" })
export class Crvpadbenef {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("varchar", { primary: true, name: "NROBEN", length: 40 })
  nroben: string;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

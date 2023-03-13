import { Column, Entity, Index } from "typeorm";

@Index("PK___12__10", ["codooss"], { unique: true })
@Entity("FBPOOSS", { schema: "dbo" })
export class Fbpooss {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 50 })
  nombre: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

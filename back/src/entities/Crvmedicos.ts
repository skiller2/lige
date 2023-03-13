import { Column, Entity, Index } from "typeorm";

@Index("PK___19__10", ["codooss", "matmed"], { unique: true })
@Entity("CRVMEDICOS", { schema: "dbo" })
export class Crvmedicos {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("varchar", { primary: true, name: "MATMED", length: 40 })
  matmed: string;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

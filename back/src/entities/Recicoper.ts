import { Column, Entity, Index } from "typeorm";

@Index("PK___5__12", ["cod"], { unique: true })
@Entity("RECICOPER", { schema: "dbo" })
export class Recicoper {
  @Column("int", { primary: true, name: "Cod" })
  cod: number;

  @Column("varchar", { name: "Descrip", nullable: true, length: 30 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODSUC", nullable: true })
  codsuc: number | null;
}

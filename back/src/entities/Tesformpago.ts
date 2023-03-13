import { Column, Entity, Index } from "typeorm";

@Index("PK_TESFORMPAGO_1__29", ["codpago"], { unique: true })
@Entity("TESFORMPAGO", { schema: "dbo" })
export class Tesformpago {
  @Column("int", { primary: true, name: "CODPAGO" })
  codpago: number;

  @Column("varchar", { name: "DESCRI", nullable: true, length: 20 })
  descri: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_MAECOLCART_2__10", ["coduni"], { unique: true })
@Entity("MAECOLCART", { schema: "dbo" })
export class Maecolcart {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "TIPO", nullable: true, default: () => "1" })
  tipo: number | null;

  @Column("datetime", { name: "FECRECEP", nullable: true })
  fecrecep: Date | null;

  @Column("datetime", { name: "FECPAGO", nullable: true })
  fecpago: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 100 })
  observ: string | null;
}

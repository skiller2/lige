import { Column, Entity, Index } from "typeorm";

@Index("PK_TORTAPA_TOTALES", ["expr1"], { unique: true })
@Entity("TORTAPA_TOTALES", { schema: "dbo" })
export class TortapaTotales {
  @Column("float", { primary: true, name: "Expr1", precision: 53 })
  expr1: number;

  @Column("int", { name: "NroFar", nullable: true })
  nroFar: number | null;

  @Column("varchar", { name: "PESOSENLETRAS", nullable: true, length: 100 })
  pesosenletras: string | null;
}

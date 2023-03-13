import { Column, Entity, Index } from "typeorm";

@Index("PK_PARAMETROS", ["parCod", "aplCod"], { unique: true })
@Entity("PARAMETROS", { schema: "dbo" })
export class Parametros {
  @Column("varchar", { primary: true, name: "par_Cod", length: 50 })
  parCod: string;

  @Column("int", { primary: true, name: "apl_Cod" })
  aplCod: number;

  @Column("varchar", { name: "par_Valor", nullable: true, length: 500 })
  parValor: string | null;

  @Column("int", { name: "ope_Cod" })
  opeCod: number;

  @Column("datetime", { name: "par_Stampa", default: () => "getdate()" })
  parStampa: Date;
}

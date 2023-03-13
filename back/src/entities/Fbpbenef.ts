import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPBENEF_2__26", ["codbene"], { unique: true })
@Entity("FBPBENEF", { schema: "dbo" })
export class Fbpbenef {
  @Column("varchar", { primary: true, name: "CODBENE", length: 20 })
  codbene: string;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "CODUPI", nullable: true, default: () => "0" })
  codupi: number | null;

  @Column("datetime", { name: "FECACT", nullable: true })
  fecact: Date | null;

  @Column("int", { name: "CODOOSS", nullable: true, default: () => "0" })
  codooss: number | null;
}

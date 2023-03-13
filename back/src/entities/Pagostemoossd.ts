import { Column, Entity, Index } from "typeorm";

@Index("PARAVERIF", ["codpagos", "nrofar"], {})
@Index("PK_PAGOSTEMOOSSD_1__10", ["coduni"], { unique: true })
@Entity("PAGOSTEMOOSSD", { schema: "dbo" })
export class Pagostemoossd {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODPAGOS" })
  codpagos: number;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "SIGNO", nullable: true, default: () => "1" })
  signo: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 10 })
  nropami: string | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 50 })
  observ: string | null;
}

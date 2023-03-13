import { Column, Entity, Index } from "typeorm";

@Index("NROFAR_CODOOSS", ["nrofar", "codooss"], {})
@Index("PK_SALDOSDEBINOC_4__32", ["id"], { unique: true })
@Entity("SALDOSDEBINOC", { schema: "dbo" })
export class Saldosdebinoc {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("money", { name: "IMPORTE", default: () => "0" })
  importe: number;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;
}

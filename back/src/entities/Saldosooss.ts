import { Column, Entity, Index } from "typeorm";

@Index("PARACUENOOSS", ["codooss", "codplan", "nrofar"], { unique: true })
@Index("PK_SALDOSOOSS_5__10", ["coduni"], { unique: true })
@Entity("SALDOSOOSS", { schema: "dbo" })
export class Saldosooss {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODOOSS" })
  codooss: number;

  @Column("int", { name: "CODPLAN", default: () => "0" })
  codplan: number;

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
}

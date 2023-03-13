import { Column, Entity, Index } from "typeorm";

@Index("PK_PAGOSTEMOOSS_1__10", ["coduni"], { unique: true })
@Entity("PAGOSTEMOOSS", { schema: "dbo" })
export class Pagostemooss {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("int", { name: "CODMOVI", nullable: true })
  codmovi: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;
}

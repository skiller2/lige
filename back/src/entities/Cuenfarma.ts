import { Column, Entity, Index } from "typeorm";

@Index("PKcuenfarma", ["coduni"], { unique: true })
@Index("PORNROFAR", ["nrofar", "coduni"], {})
@Entity("CUENFARMA", { schema: "dbo" })
export class Cuenfarma {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODGRUPO", nullable: true, default: () => "0" })
  codgrupo: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "CODMOVI", nullable: true, default: () => "0" })
  codmovi: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "SIGNO", nullable: true, default: () => "1" })
  signo: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "CODPLAN", nullable: true, default: () => "0" })
  codplan: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("int", { name: "CODOOSS", nullable: true, default: () => "0" })
  codooss: number | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "CODLIQ", nullable: true, default: () => "0" })
  codliq: number | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("datetime", { name: "FECHAOBS", nullable: true })
  fechaobs: Date | null;

  @Column("int", { name: "CODPAGOS", nullable: true, default: () => "0" })
  codpagos: number | null;

  @Column("int", { name: "borrar2", nullable: true, default: () => "0" })
  borrar2: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_CUENDEBINOC_1__38", ["id"], { unique: true })
@Entity("CUENDEBINOC", { schema: "dbo" })
export class Cuendebinoc {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "CODMOV", nullable: true })
  codmov: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("money", { name: "IMPORTE", default: () => "0" })
  importe: number;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("money", { name: "SALDO", default: () => "0" })
  saldo: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "CODGRUPO", nullable: true })
  codgrupo: number | null;
}

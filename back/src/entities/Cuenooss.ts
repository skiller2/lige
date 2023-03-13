import { Column, Entity, Index } from "typeorm";

@Index("PARACUENOOSS", ["codooss", "codplan", "nrofar"], {})
@Index("PARAPEPCO", ["codliq", "codplan", "nrofar", "codmovi"], {})
@Index("PK_CUENOOSS", ["coduni"], { unique: true })
@Index("PORFECHA", ["fecha", "coduni"], {})
@Entity("CUENOOSS", { schema: "dbo" })
export class Cuenooss {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true, default: () => "0" })
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

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("datetime", { name: "FECHAOBS", nullable: true })
  fechaobs: Date | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "CODGRUPO", nullable: true })
  codgrupo: number | null;

  @Column("int", { name: "CODPAGOS", nullable: true })
  codpagos: number | null;
}

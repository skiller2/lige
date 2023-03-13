import { Column, Entity, Index } from "typeorm";

@Index("PK_TESMOVCUE_4__20", ["coduni"], { unique: true })
@Entity("TESMOVCUE", { schema: "dbo" })
export class Tesmovcue {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "TIPOCUE" })
  tipocue: number;

  @Column("datetime", {
    name: "FECHA",
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date;

  @Column("varchar", { name: "IMPUTA", nullable: true, length: 255 })
  imputa: string | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "STAMPA1", nullable: true })
  stampa1: number | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("int", { name: "CHEQUE", nullable: true })
  cheque: number | null;

  @Column("int", { name: "RECIBO", nullable: true })
  recibo: number | null;

  @Column("int", { name: "NROCOLE", nullable: true })
  nrocole: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "BANCO", nullable: true, length: 100 })
  banco: string | null;

  @Column("int", { name: "CODMOV", nullable: true })
  codmov: number | null;

  @Column("int", { name: "OPAGO", nullable: true })
  opago: number | null;

  @Column("int", { name: "COMPROB", nullable: true })
  comprob: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "FORPAGO", nullable: true, default: () => "1" })
  forpago: number | null;
}

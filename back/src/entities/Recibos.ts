import { Column, Entity, Index } from "typeorm";

@Index("PK_RECIBOS_1__11", ["nrorec"], { unique: true })
@Index("PorNroFEC", ["fecha", "nrorec"], {})
@Entity("RECIBOS", { schema: "dbo" })
export class Recibos {
  @Column("int", { primary: true, name: "NROREC" })
  nrorec: number;

  @Column("int", { name: "NROCOL", nullable: true, default: () => "0" })
  nrocol: number | null;

  @Column("int", { name: "NROFAR", nullable: true, default: () => "0" })
  nrofar: number | null;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "DIRECCION", nullable: true, length: 100 })
  direccion: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "COPER", nullable: true })
  coper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "FPAGO", nullable: true })
  fpago: number | null;

  @Column("int", { name: "CHEQUE", nullable: true, default: () => "0" })
  cheque: number | null;

  @Column("datetime", { name: "FECHEQUE", nullable: true })
  fecheque: Date | null;

  @Column("int", { name: "DIASCHE", nullable: true, default: () => "0" })
  diasche: number | null;

  @Column("varchar", { name: "BANCO", nullable: true, length: 40 })
  banco: string | null;

  @Column("int", { name: "PEND", nullable: true, default: () => "1" })
  pend: number | null;

  @Column("money", { name: "IMPEFV", nullable: true, default: () => "0" })
  impefv: number | null;

  @Column("money", { name: "IMPCHE", nullable: true, default: () => "0" })
  impche: number | null;

  @Column("money", { name: "IMPDOC", nullable: true, default: () => "0" })
  impdoc: number | null;

  @Column("int", { name: "FOB", nullable: true })
  fob: number | null;

  @Column("int", { name: "PERCOB", nullable: true, default: () => "0" })
  percob: number | null;

  @Column("int", { name: "CODCOB", nullable: true, default: () => "0" })
  codcob: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_TESPAGOS_3__20", ["cod"], { unique: true })
@Entity("TESPAGOS", { schema: "dbo" })
export class Tespagos {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("int", { name: "OPAGO", nullable: true })
  opago: number | null;

  @Column("int", { name: "CHEQUE", nullable: true })
  cheque: number | null;

  @Column("int", { name: "TIPOCUE", nullable: true, default: () => "0" })
  tipocue: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("varchar", { name: "PAGARA", nullable: true, length: 255 })
  pagara: string | null;

  @Column("varchar", { name: "NOUSAR", nullable: true, length: 255 })
  nousar: string | null;

  @Column("varchar", { name: "IMPUTAR", nullable: true, length: 255 })
  imputar: string | null;

  @Column("varchar", { name: "DETALLE", nullable: true, length: 255 })
  detalle: string | null;

  @Column("int", { name: "CODBCOCU", nullable: true, default: () => "0" })
  codbcocu: number | null;

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

  @Column("datetime", { name: "CHEFECHA", nullable: true })
  chefecha: Date | null;

  @Column("int", { name: "CODMOV", nullable: true })
  codmov: number | null;
}

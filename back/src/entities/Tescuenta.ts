import { Column, Entity, Index } from "typeorm";

@Index("PK_TESCUENTA_1__20", ["tipocue"], { unique: true })
@Entity("TESCUENTA", { schema: "dbo" })
export class Tescuenta {
  @Column("int", { primary: true, name: "TIPOCUE" })
  tipocue: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("money", { name: "ALERTA", nullable: true })
  alerta: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "MESDIA", nullable: true })
  mesdia: number | null;

  @Column("int", { name: "CANTIEM", nullable: true })
  cantiem: number | null;

  @Column("int", { name: "CODBCOCU", nullable: true })
  codbcocu: number | null;
}

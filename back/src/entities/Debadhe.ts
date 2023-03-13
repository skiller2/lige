import { Column, Entity, Index } from "typeorm";

@Index("PK___2__22", ["id"], { unique: true })
@Index("UQ_DEBADHE_1__12", ["codeb", "nrofar"], { unique: true })
@Entity("DEBADHE", { schema: "dbo" })
export class Debadhe {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "CODEB", unique: true })
  codeb: number;

  @Column("int", { name: "NROFAR", unique: true })
  nrofar: number;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "FBAJA", nullable: true })
  fbaja: Date | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "TIPCOBR", nullable: true, default: () => "3" })
  tipcobr: number | null;

  @Column("int", { name: "MAXCUOT", nullable: true })
  maxcuot: number | null;

  @Column("int", { name: "RESERVA", nullable: true })
  reserva: number | null;

  @Column("int", { name: "RESTOCUOT", nullable: true })
  restocuot: number | null;

  @Column("money", { name: "MAXSALD", nullable: true, default: () => "0" })
  maxsald: number | null;

  @Column("varchar", { name: "CUENCONTABL", nullable: true, length: 50 })
  cuencontabl: string | null;
}

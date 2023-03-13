import { Column, Entity, Index } from "typeorm";

@Index("PK___2__22COL", ["id"], { unique: true })
@Index("UQ_DEBADHECOL_1__12", ["codeb", "nrocol"], { unique: true })
@Entity("DEBADHECOL", { schema: "dbo" })
export class Debadhecol {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "CODEB", unique: true })
  codeb: number;

  @Column("int", { name: "NROCOL", unique: true })
  nrocol: number;

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

  @Column("int", { name: "FARMCOBR", nullable: true })
  farmcobr: number | null;

  @Column("int", { name: "MAXCUOT", nullable: true })
  maxcuot: number | null;

  @Column("money", { name: "MAXSALD", nullable: true, default: () => "0" })
  maxsald: number | null;

  @Column("int", { name: "RESTOCUOT", nullable: true })
  restocuot: number | null;
}

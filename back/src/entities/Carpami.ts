import { Column, Entity, Index } from "typeorm";

@Index("PK___2__21", ["id"], { unique: true })
@Index("PORNROPAMI", ["codper", "nropami"], {})
@Entity("CARPAMI", { schema: "dbo" })
export class Carpami {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "CODPER", nullable: true, default: () => "0" })
  codper: number | null;

  @Column("varchar", {
    name: "NROPAMI",
    nullable: true,
    length: 10,
    default: () => "null",
  })
  nropami: string | null;

  @Column("int", { name: "CANTREC", nullable: true, default: () => "0" })
  cantrec: number | null;

  @Column("money", { name: "TOTFACT", nullable: true, default: () => "0" })
  totfact: number | null;

  @Column("money", { name: "CARGOPAMI", nullable: true, default: () => "0" })
  cargopami: number | null;

  @Column("money", { name: "BONIF", nullable: true, default: () => "0" })
  bonif: number | null;

  @Column("money", { name: "NOTCRED1", nullable: true, default: () => "0" })
  notcred1: number | null;

  @Column("money", { name: "NOTCRED2", nullable: true, default: () => "0" })
  notcred2: number | null;

  @Column("money", { name: "DEBITOT", nullable: true, default: () => "0" })
  debitot: number | null;

  @Column("money", { name: "CONC", nullable: true, default: () => "0" })
  conc: number | null;

  @Column("money", { name: "ANTICIPO", nullable: true, default: () => "0" })
  anticipo: number | null;

  @Column("int", { name: "AJUCANT", nullable: true, default: () => "0" })
  ajucant: number | null;

  @Column("money", { name: "AJUMONTO", nullable: true, default: () => "0" })
  ajumonto: number | null;

  @Column("int", { name: "OBSCANT", nullable: true, default: () => "0" })
  obscant: number | null;

  @Column("money", { name: "OBSMONTO", nullable: true, default: () => "0" })
  obsmonto: number | null;

  @Column("int", { name: "RECHCANT", nullable: true, default: () => "0" })
  rechcant: number | null;

  @Column("money", { name: "RECHMONTO", nullable: true, default: () => "0" })
  rechmonto: number | null;

  @Column("int", { name: "SUMCANT", nullable: true, default: () => "0" })
  sumcant: number | null;

  @Column("money", { name: "INGBRUT", nullable: true, default: () => "0" })
  ingbrut: number | null;

  @Column("money", { name: "SUBTOTAL", nullable: true, default: () => "0" })
  subtotal: number | null;

  @Column("money", { name: "RETDGI", nullable: true, default: () => "0" })
  retdgi: number | null;

  @Column("money", { name: "AREINTEG", nullable: true, default: () => "0" })
  areinteg: number | null;

  @Column("int", { name: "OPER", nullable: true, default: () => "0" })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "TIEMPO", nullable: true })
  tiempo: Date | null;

  @Column("int", { name: "BORRA1", nullable: true, default: () => "0" })
  borra1: number | null;

  @Column("money", { name: "DIFPRE", nullable: true, default: () => "0" })
  difpre: number | null;

  @Column("int", { name: "BORRA2", nullable: true })
  borra2: number | null;

  @Column("money", { name: "ORTOT_AC", nullable: true, default: () => "0" })
  ortotAc: number | null;

  @Column("money", { name: "ORBONIF", nullable: true, default: () => "0" })
  orbonif: number | null;

  @Column("money", { name: "DIFTOTFAC", nullable: true, default: () => "0" })
  diftotfac: number | null;

  @Column("int", { name: "BORRA3", nullable: true, default: () => "0" })
  borra3: number | null;

  @Column("money", { name: "ORTOT_FAC", nullable: true, default: () => "0" })
  ortotFac: number | null;
}

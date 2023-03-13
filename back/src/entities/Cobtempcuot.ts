import { Column, Entity, Index } from "typeorm";

@Index("PK_COBTEMPCUOT_1__10", ["coduni"], { unique: true })
@Entity("COBTEMPCUOT", { schema: "dbo" })
export class Cobtempcuot {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "PERCOB", nullable: true, default: () => "0" })
  percob: number | null;

  @Column("int", { name: "NROREC", nullable: true })
  nrorec: number | null;

  @Column("int", { name: "FLAG", nullable: true })
  flag: number | null;

  @Column("int", { name: "CALLE", nullable: true })
  calle: number | null;

  @Column("int", { name: "NUMERO", nullable: true })
  numero: number | null;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("int", { name: "CODCOB", nullable: true })
  codcob: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 100 })
  observ: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "COLOFAR", nullable: true })
  colofar: number | null;

  @Column("int", { name: "TIPOCAN", nullable: true })
  tipocan: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;

  @Column("int", { name: "FOB", nullable: true, default: () => "0" })
  fob: number | null;

  @Column("int", { name: "MARCA", nullable: true, default: () => "0" })
  marca: number | null;

  @Column("int", { name: "CHEQUE", nullable: true })
  cheque: number | null;

  @Column("datetime", { name: "FECHEQUE", nullable: true })
  fecheque: Date | null;

  @Column("varchar", { name: "BANCO", nullable: true, length: 40 })
  banco: string | null;

  @Column("int", { name: "CODZONA", nullable: true, default: () => "0" })
  codzona: number | null;
}

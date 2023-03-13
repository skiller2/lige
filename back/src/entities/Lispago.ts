import { Column, Entity, Index } from "typeorm";

@Index("PK___1__23", ["coduni"], { unique: true })
@Entity("LISPAGO", { schema: "dbo" })
export class Lispago {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("char", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;

  @Column("datetime", { name: "FECHAENTR", nullable: true })
  fechaentr: Date | null;

  @Column("money", { name: "DEBINOC", nullable: true })
  debinoc: number | null;

  @Column("money", { name: "COMISION", nullable: true })
  comision: number | null;

  @Column("money", { name: "COMIPROV", nullable: true })
  comiprov: number | null;

  @Column("money", { name: "INGBRT", nullable: true })
  ingbrt: number | null;

  @Column("money", { name: "NETOAPAG", nullable: true })
  netoapag: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODGRUPO", nullable: true })
  codgrupo: number | null;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;
}

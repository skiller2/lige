import { Column, Entity, Index } from "typeorm";

@Index("PK___3__14", ["coduni"], { unique: true })
@Entity("REPCO", { schema: "dbo" })
export class Repco {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODLIQ", nullable: true })
  codliq: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("money", { name: "TOT_AC", nullable: true })
  totAc: number | null;

  @Column("money", { name: "AJUSTES", nullable: true })
  ajustes: number | null;

  @Column("money", { name: "BONIF", nullable: true })
  bonif: number | null;

  @Column("int", { name: "BORRAR", nullable: true })
  borrar: number | null;

  @Column("money", { name: "COMIPROV", nullable: true })
  comiprov: number | null;

  @Column("money", { name: "DEBINOC", nullable: true })
  debinoc: number | null;

  @Column("datetime", { name: "FBAJA", nullable: true })
  fbaja: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("money", { name: "COMISION", nullable: true })
  comision: number | null;

  @Column("money", { name: "NOTACRED", nullable: true })
  notacred: number | null;

  @Column("float", { name: "PORCEN", nullable: true, precision: 53 })
  porcen: number | null;
}

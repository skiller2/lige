import { Column, Entity, Index } from "typeorm";

@Index("PK___11__10", ["codpec"], { unique: true })
@Entity("PECINSCRIP", { schema: "dbo" })
export class Pecinscrip {
  @Column("int", { primary: true, name: "CODPEC" })
  codpec: number;

  @Column("varchar", { name: "INSTITUT", nullable: true, length: 50 })
  institut: string | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("varchar", { name: "PROFES", nullable: true, length: 50 })
  profes: string | null;

  @Column("int", { name: "NROCALL", nullable: true })
  nrocall: number | null;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("varchar", { name: "TELE", nullable: true, length: 20 })
  tele: string | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 20 })
  fax: string | null;

  @Column("money", { name: "TOTDEU", nullable: true })
  totdeu: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "DNRO", nullable: true })
  dnro: number | null;

  @Column("varchar", { name: "DOTROS", nullable: true, length: 10 })
  dotros: string | null;
}

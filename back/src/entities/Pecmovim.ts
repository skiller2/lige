import { Column, Entity, Index } from "typeorm";

@Index("PK___17__10", ["coduni"], { unique: true })
@Entity("PECMOVIM", { schema: "dbo" })
export class Pecmovim {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CODPEC", nullable: true })
  codpec: number | null;

  @Column("money", { name: "IMPINT", nullable: true })
  impint: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 50 })
  observ: string | null;

  @Column("int", { name: "NROORD", nullable: true })
  nroord: number | null;

  @Column("int", { name: "NROREC", nullable: true })
  nrorec: number | null;

  @Column("datetime", { name: "FECARG", nullable: true })
  fecarg: Date | null;

  @Column("datetime", { name: "FECPAG", nullable: true })
  fecpag: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_MDEMODIFICH", ["coduni"], { unique: true })
@Entity("MDEMODIFICH", { schema: "dbo" })
export class Mdemodifich {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CONTROL", nullable: true })
  control: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CATEGOLD", nullable: true })
  categold: number | null;

  @Column("money", { name: "IMPORTEOLD", nullable: true })
  importeold: number | null;

  @Column("int", { name: "FLAGOLD", nullable: true })
  flagold: number | null;

  @Column("int", { name: "CATEGNEW", nullable: true })
  categnew: number | null;

  @Column("money", { name: "IMPORTENEW", nullable: true })
  importenew: number | null;

  @Column("int", { name: "FLAGNEW", nullable: true })
  flagnew: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "FECFLAOLD", nullable: true })
  fecflaold: Date | null;
}

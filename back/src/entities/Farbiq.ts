import { Column, Entity, Index } from "typeorm";

@Index("PK_FARBIQ_1__12", ["nrosoc"], { unique: true })
@Entity("FARBIQ", { schema: "dbo" })
export class Farbiq {
  @Column("int", { primary: true, name: "NROSOC" })
  nrosoc: number;

  @Column("int", { name: "NROCOL" })
  nrocol: number;

  @Column("varchar", { name: "APENOM", nullable: true, length: 30 })
  apenom: string | null;

  @Column("varchar", { name: "CALLE", nullable: true, length: 35 })
  calle: string | null;

  @Column("int", { name: "NUMERO" })
  numero: number;

  @Column("varchar", { name: "OTROS", nullable: true, length: 10 })
  otros: string | null;

  @Column("int", { name: "CODPOST" })
  codpost: number;

  @Column("varchar", { name: "LOCA_", nullable: true, length: 30 })
  loca: string | null;

  @Column("int", { name: "TELEF", nullable: true })
  telef: number | null;

  @Column("varchar", { name: "TIPODOC", nullable: true, length: 3 })
  tipodoc: string | null;

  @Column("int", { name: "NRODOC" })
  nrodoc: number;

  @Column("varchar", { name: "PROF", nullable: true, length: 1 })
  prof: string | null;

  @Column("int", { name: "CATSOC" })
  catsoc: number;

  @Column("datetime", { name: "FINGRE", nullable: true })
  fingre: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CARNET", nullable: true, default: () => "0" })
  carnet: number | null;
}

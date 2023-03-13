import { Column, Entity, Index } from "typeorm";

@Index("PARA_FACBIOQ", ["codper", "nroprac", "codbole"], {})
@Index("PK_FBPBOLETA", ["codbole"], { unique: true })
@Entity("FBPBOLETA", { schema: "dbo" })
export class Fbpboleta {
  @Column("int", { primary: true, name: "CODBOLE" })
  codbole: number;

  @Column("int", { name: "CODPER", nullable: true })
  codper: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "QUINC", nullable: true })
  quinc: number | null;

  @Column("int", { name: "CODLABO", nullable: true })
  codlabo: number | null;

  @Column("int", { name: "CODMEDI", nullable: true })
  codmedi: number | null;

  @Column("varchar", { name: "CODBENE", nullable: true, length: 50 })
  codbene: string | null;

  @Column("int", { name: "NROPRAC", nullable: true })
  nroprac: number | null;

  @Column("varchar", { name: "NOMBENE", nullable: true, length: 100 })
  nombene: string | null;

  @Column("varchar", { name: "DIAGNOST", nullable: true, length: 100 })
  diagnost: string | null;

  @Column("datetime", { name: "TIEMPO", nullable: true })
  tiempo: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "FECEMI", nullable: true })
  fecemi: Date | null;

  @Column("int", { name: "CODOOSS", nullable: true, default: () => "0" })
  codooss: number | null;

  @Column("int", { name: "CODERR", nullable: true, default: () => "0" })
  coderr: number | null;

  @Column("int", { name: "CODPAD", nullable: true, default: () => "0" })
  codpad: number | null;

  @Column("datetime", { name: "FECPRE", nullable: true })
  fecpre: Date | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;
}

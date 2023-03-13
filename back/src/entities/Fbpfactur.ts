import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPFACTUR_1__27", ["coduni"], { unique: true })
@Entity("FBPFACTUR", { schema: "dbo" })
export class Fbpfactur {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "QUINC", nullable: true })
  quinc: number | null;

  @Column("int", { name: "CODPER", nullable: true })
  codper: number | null;

  @Column("int", { name: "CODLABO", nullable: true })
  codlabo: number | null;

  @Column("int", { name: "NROBOL", nullable: true })
  nrobol: number | null;

  @Column("int", { name: "CODPAD", nullable: true })
  codpad: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("varchar", { name: "NOMBENE", nullable: true, length: 100 })
  nombene: string | null;

  @Column("varchar", { name: "PRESTAC", nullable: true, length: 255 })
  prestac: string | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "CODBENE", nullable: true, length: 20 })
  codbene: string | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "CODERR", nullable: true })
  coderr: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;
}

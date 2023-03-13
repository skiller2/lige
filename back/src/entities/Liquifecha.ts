import { Column, Entity, Index } from "typeorm";

@Index("periodo", ["codooss", "anio", "mes", "clase", "quiosem"], {
  unique: true,
})
@Index("PK___7__10", ["coduni"], { unique: true })
@Entity("LIQUIFECHA", { schema: "dbo" })
export class Liquifecha {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODLIQ", nullable: true, default: () => "0" })
  codliq: number | null;

  @Column("int", { name: "ANIO", nullable: true, unique: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true, unique: true })
  mes: number | null;

  @Column("char", { name: "CLASE", nullable: true, unique: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true, unique: true })
  quiosem: number | null;

  @Column("int", { name: "BORRAR", nullable: true })
  borrar: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODOOSS", nullable: true, unique: true })
  codooss: number | null;

  @Column("datetime", { name: "FECPRE", nullable: true })
  fecpre: Date | null;
}

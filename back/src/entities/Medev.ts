import { Column, Entity, Index } from "typeorm";

@Index("pk_medev", ["mcod"], { unique: true })
@Entity("MEDEV", { schema: "dbo" })
export class Medev {
  @Column("int", { primary: true, name: "MCOD" })
  mcod: number;

  @Column("int", { name: "COLE", nullable: true })
  cole: number | null;

  @Column("char", { name: "FARM", nullable: true, length: 30 })
  farm: string | null;

  @Column("char", { name: "LABO", nullable: true, length: 20 })
  labo: string | null;

  @Column("char", { name: "PROD", nullable: true, length: 25 })
  prod: string | null;

  @Column("char", { name: "FORM", nullable: true, length: 15 })
  form: string | null;

  @Column("int", { name: "CONT", nullable: true })
  cont: number | null;

  @Column("int", { name: "CANT", nullable: true })
  cant: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

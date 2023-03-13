import { Column, Entity, Index } from "typeorm";

@Index("PK___2__10", ["coduni"], { unique: true })
@Entity("CUODETA", { schema: "dbo" })
export class Cuodeta {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODCUOTA", nullable: true })
  codcuota: number | null;

  @Column("int", { name: "CODITEM", nullable: true })
  coditem: number | null;

  @Column("money", { name: "VALOR", nullable: true, default: () => "0" })
  valor: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "IMPUTAR", nullable: true, length: 100 })
  imputar: string | null;
}

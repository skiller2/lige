import { Column, Entity, Index } from "typeorm";

@Index("PK___1__12", ["nro"], { unique: true })
@Entity("MAECALLES", { schema: "dbo" })
export class Maecalles {
  @Column("int", { primary: true, name: "NRO" })
  nro: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "NOMBRE1", nullable: true, length: 100 })
  nombre1: string | null;

  @Column("int", { name: "NUMDESDE", nullable: true })
  numdesde: number | null;

  @Column("int", { name: "NUMHASTA", nullable: true })
  numhasta: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

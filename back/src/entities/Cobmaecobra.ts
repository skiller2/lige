import { Column, Entity, Index } from "typeorm";

@Index("PK___13__10", ["cobnro"], { unique: true })
@Entity("COBMAECOBRA", { schema: "dbo" })
export class Cobmaecobra {
  @Column("int", { primary: true, name: "COBNRO" })
  cobnro: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "NRODOC", nullable: true, length: 20 })
  nrodoc: string | null;

  @Column("varchar", { name: "TEL", nullable: true, length: 20 })
  tel: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "BAJA", nullable: true })
  baja: Date | null;
}

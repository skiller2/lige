import { Column, Entity, Index } from "typeorm";

@Index("PK___4__14", ["nrodro"], { unique: true })
@Entity("MAEDROGUE", { schema: "dbo" })
export class Maedrogue {
  @Column("int", { primary: true, name: "NRODRO" })
  nrodro: number;

  @Column("varchar", { name: "RAZONSOC", nullable: true, length: 100 })
  razonsoc: string | null;

  @Column("varchar", { name: "DOMICILIO", nullable: true, length: 100 })
  domicilio: string | null;

  @Column("varchar", { name: "LOCALIDAD", nullable: true, length: 100 })
  localidad: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "TELEF", nullable: true, length: 20 })
  telef: string | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 20 })
  fax: string | null;
}

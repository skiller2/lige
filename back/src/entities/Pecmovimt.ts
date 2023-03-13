import { Column, Entity, Index } from "typeorm";

@Index("PK_PECMOVIMT_1__10", ["coduni"], { unique: true })
@Entity("PECMOVIMT", { schema: "dbo" })
export class Pecmovimt {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CODPEC", nullable: true })
  codpec: number | null;

  @Column("money", { name: "IMPINT", nullable: true })
  impint: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 50 })
  observ: string | null;

  @Column("datetime", { name: "FECARG", nullable: true })
  fecarg: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_CCPAMI2", ["id"], { unique: true })
@Index("porid", ["id"], { unique: true })
@Index("POROPTI", ["nrofar", "anio", "mes", "codref", "observ"], {})
@Entity("CCPAMI2", { schema: "dbo" })
export class Ccpami2 {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("smallint", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 20 })
  nropami: string | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 50 })
  observ: string | null;

  @Column("smallint", { name: "CODREF", nullable: true })
  codref: number | null;

  @Column("smallint", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("money", { name: "MONTO", nullable: true })
  monto: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "test", nullable: true })
  test: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_COBRANZA", ["nroregistro"], { unique: true })
@Entity("COBRANZA", { schema: "dbo" })
export class Cobranza {
  @Column("int", { primary: true, name: "NROREGISTRO" })
  nroregistro: number;

  @Column("smallint", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("smallint", { name: "MES", nullable: true })
  mes: number | null;

  @Column("smallint", { name: "COLEGIADO", nullable: true })
  colegiado: number | null;

  @Column("float", { name: "MONTO", nullable: true, precision: 53 })
  monto: number | null;

  @Column("varchar", { name: "OBSERVACIONES", nullable: true, length: 50 })
  observaciones: string | null;
}

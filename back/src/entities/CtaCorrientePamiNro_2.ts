import { Column, Entity, Index } from "typeorm";

@Index("PK_CTA_CORRIENTE_PAMI_NRO_2", ["id"], { unique: true })
@Entity("CTA_CORRIENTE_PAMI_NRO_2", { schema: "dbo" })
export class CtaCorrientePamiNro_2 {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("smallint", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NROPAMI", nullable: true, length: 20 })
  nropami: string | null;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 50 })
  nombre: string | null;

  @Column("smallint", { name: "CODREF", nullable: true })
  codref: number | null;

  @Column("smallint", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("money", { name: "MONTO", nullable: true })
  monto: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;
}

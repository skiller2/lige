import { Column, Entity, Index } from "typeorm";

@Index("PK_OBSERVAC", ["nro"], { unique: true })
@Index("PorNombre", ["observacio"], {})
@Entity("Observac", { schema: "dbo" })
export class Observac {
  @Column("int", { primary: true, name: "NRO" })
  nro: number;

  @Column("varchar", { name: "OBSERVACIO", nullable: true, length: 50 })
  observacio: string | null;
}

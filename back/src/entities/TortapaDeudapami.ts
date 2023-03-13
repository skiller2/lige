import { Column, Entity, Index } from "typeorm";

@Index("PK_TORTAPA", ["id"], { unique: true })
@Entity("TORTAPA_DEUDAPAMI", { schema: "dbo" })
export class TortapaDeudapami {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "PLANS", nullable: true })
  plans: number | null;

  @Column("varchar", { name: "Periodo", nullable: true, length: 6 })
  periodo: string | null;

  @Column("int", { name: "NroFar", nullable: true })
  nroFar: number | null;

  @Column("int", { name: "NroPami", nullable: true })
  nroPami: number | null;

  @Column("varchar", { name: "FNOMBRE", nullable: true, length: 30 })
  fnombre: string | null;

  @Column("money", { name: "TOT1", nullable: true })
  tot1: number | null;

  @Column("money", { name: "TOT2", nullable: true })
  tot2: number | null;

  @Column("money", { name: "TOT3", nullable: true })
  tot3: number | null;

  @Column("money", { name: "DIFERENCIA", nullable: true })
  diferencia: number | null;

  @Column("varchar", { name: "PESOSLETRAS", nullable: true, length: 255 })
  pesosletras: string | null;
}

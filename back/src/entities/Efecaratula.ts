import { Column, Entity, Index } from "typeorm";

@Index("PK_EFECARATULA", ["ecaCod"], { unique: true })
@Entity("EFECARATULA", { schema: "dbo" })
export class Efecaratula {
  @Column("int", { primary: true, name: "eca_Cod" })
  ecaCod: number;

  @Column("int", { name: "eca_estado", nullable: true })
  ecaEstado: number | null;

  @Column("datetime", { name: "eca_fecdes", nullable: true })
  ecaFecdes: Date | null;

  @Column("datetime", { name: "eca_fechas", nullable: true })
  ecaFechas: Date | null;

  @Column("varchar", { name: "eca_observaciones", nullable: true, length: 500 })
  ecaObservaciones: string | null;

  @Column("float", { name: "eca_Factor", nullable: true, precision: 53 })
  ecaFactor: number | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "eca_stampa", nullable: true })
  ecaStampa: Date | null;
}

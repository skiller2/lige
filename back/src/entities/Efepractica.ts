import { Column, Entity, Index } from "typeorm";

@Index(
  "IX_EFEPRACTICA",
  ["ecaCod", "epaFecrea", "epaNben", "epaGpar", "evaCodBioq"],
  { unique: true }
)
@Index("PK_efepracticas", ["epaCod"], { unique: true })
@Entity("EFEPRACTICA", { schema: "dbo" })
export class Efepractica {
  @Column("int", { primary: true, name: "epa_Cod" })
  epaCod: number;

  @Column("int", { name: "eca_Cod", nullable: true })
  ecaCod: number | null;

  @Column("int", { name: "mla_cod", nullable: true })
  mlaCod: number | null;

  @Column("int", { name: "epa_mnac", nullable: true })
  epaMnac: number | null;

  @Column("char", { name: "epa_nben", nullable: true, length: 13 })
  epaNben: string | null;

  @Column("char", { name: "epa_gpar", nullable: true, length: 10 })
  epaGpar: string | null;

  @Column("datetime", { name: "epa_fecrea", nullable: true })
  epaFecrea: Date | null;

  @Column("int", { name: "eva_cod_bioq", nullable: true })
  evaCodBioq: number | null;

  @Column("int", { name: "epa_det_cant", nullable: true })
  epaDetCant: number | null;

  @Column("float", { name: "epa_Tiempo", nullable: true, precision: 53 })
  epaTiempo: number | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "epa_stampa", nullable: true })
  epaStampa: Date | null;

  @Column("int", { name: "ein_Cod", nullable: true })
  einCod: number | null;

  @Column("int", { name: "epa_grupo", nullable: true, default: () => "0" })
  epaGrupo: number | null;
}

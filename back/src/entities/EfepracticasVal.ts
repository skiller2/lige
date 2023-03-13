import { Column, Entity, Index } from "typeorm";

@Index("PK_efepracticas_val", ["epvCod"], { unique: true })
@Entity("EFEPRACTICAS_VAL", { schema: "dbo" })
export class EfepracticasVal {
  @Column("int", { primary: true, name: "epv_Cod" })
  epvCod: number;

  @Column("int", { name: "epa_Cod", nullable: true })
  epaCod: number | null;

  @Column("int", { name: "eca_Cod", nullable: true })
  ecaCod: number | null;

  @Column("nchar", { name: "eno_Cod", nullable: true, length: 6 })
  enoCod: string | null;

  @Column("money", { name: "epv_Importe", nullable: true })
  epvImporte: number | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "epv_Stampa", nullable: true })
  epvStampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK__evtrecursos__286DEFE4", ["denRecurso"], { unique: true })
@Entity("evtrecursos", { schema: "dbo" })
export class Evtrecursos {
  @Column("int", { primary: true, name: "den_recurso" })
  denRecurso: number;

  @Column("varchar", { name: "nom_recurso", length: 50 })
  nomRecurso: string;

  @Column("varchar", { name: "des_recurso", length: 255 })
  desRecurso: string;

  @Column("varchar", { name: "obs_recurso", nullable: true, length: 255 })
  obsRecurso: string | null;

  @Column("int", { name: "ind_stock" })
  indStock: number;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

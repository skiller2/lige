import { Column, Entity, Index } from "typeorm";

@Index(
  "PK__evtrleventorecur__2C3E80C8",
  ["denEvento", "nroEvento", "denRecurso"],
  { unique: true }
)
@Entity("evtrleventorecurso", { schema: "dbo" })
export class Evtrleventorecurso {
  @Column("int", { primary: true, name: "den_evento" })
  denEvento: number;

  @Column("int", { primary: true, name: "nro_evento" })
  nroEvento: number;

  @Column("int", { primary: true, name: "den_recurso" })
  denRecurso: number;

  @Column("varchar", { name: "obs_eventorecurso", nullable: true, length: 255 })
  obsEventorecurso: string | null;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK__evtnovedades__249D5F00", ["stmNovedad"], { unique: true })
@Entity("evtnovedades", { schema: "dbo" })
export class Evtnovedades {
  @Column("datetime", { primary: true, name: "stm_novedad" })
  stmNovedad: Date;

  @Column("int", { name: "den_evento" })
  denEvento: number;

  @Column("int", { name: "nro_evento", nullable: true })
  nroEvento: number | null;

  @Column("int", { name: "den_tiponovedad" })
  denTiponovedad: number;

  @Column("varchar", { name: "det_novedad", length: 255 })
  detNovedad: string;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

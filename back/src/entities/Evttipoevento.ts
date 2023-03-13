import { Column, Entity, Index } from "typeorm";

@Index("PK__evttipoevento__2E26C93A", ["denTipoevento"], { unique: true })
@Entity("evttipoevento", { schema: "dbo" })
export class Evttipoevento {
  @Column("int", { primary: true, name: "den_tipoevento" })
  denTipoevento: number;

  @Column("varchar", { name: "nom_tipoevento", length: 255 })
  nomTipoevento: string;

  @Column("varchar", { name: "des_tipoevento", length: 255 })
  desTipoevento: string;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

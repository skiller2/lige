import { Column, Entity, Index } from "typeorm";

@Index("PK__evttiponovedad__300F11AC", ["denTiponovedad"], { unique: true })
@Entity("evttiponovedad", { schema: "dbo" })
export class Evttiponovedad {
  @Column("int", { primary: true, name: "den_tiponovedad" })
  denTiponovedad: number;

  @Column("varchar", { name: "nom_tiponovedad", length: 255 })
  nomTiponovedad: string;

  @Column("int", { name: "ind_privado" })
  indPrivado: number;

  @Column("int", { name: "ind_notificar", nullable: true })
  indNotificar: number | null;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

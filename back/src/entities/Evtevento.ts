import { Column, Entity, Index } from "typeorm";

@Index("PK__evtevento__20CCCE1C", ["denEvento"], { unique: true })
@Entity("evtevento", { schema: "dbo" })
export class Evtevento {
  @Column("int", { primary: true, name: "den_evento" })
  denEvento: number;

  @Column("varchar", { name: "nom_evento", length: 255 })
  nomEvento: string;

  @Column("varchar", { name: "des_evento", nullable: true, length: 255 })
  desEvento: string | null;

  @Column("int", { name: "den_tipoevento" })
  denTipoevento: number;

  @Column("varchar", { name: "nom_empresa", nullable: true, length: 100 })
  nomEmpresa: string | null;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

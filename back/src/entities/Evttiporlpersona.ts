import { Column, Entity, Index } from "typeorm";

@Index("PK__evttiporlpersona__31F75A1E", ["denRelpersona"], { unique: true })
@Entity("evttiporlpersona", { schema: "dbo" })
export class Evttiporlpersona {
  @Column("int", { primary: true, name: "den_relpersona" })
  denRelpersona: number;

  @Column("varchar", { name: "nom_relpersona", length: 255 })
  nomRelpersona: string;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

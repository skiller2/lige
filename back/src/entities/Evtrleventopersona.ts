import { Column, Entity, Index } from "typeorm";

@Index(
  "PK__evtrleventoperso__2A563856",
  ["idPersona", "denEvento", "nroEvento", "denRelpersona"],
  { unique: true }
)
@Entity("evtrleventopersona", { schema: "dbo" })
export class Evtrleventopersona {
  @Column("bigint", { primary: true, name: "id_persona" })
  idPersona: string;

  @Column("int", { primary: true, name: "den_evento" })
  denEvento: number;

  @Column("int", { primary: true, name: "nro_evento" })
  nroEvento: number;

  @Column("int", { primary: true, name: "den_relpersona" })
  denRelpersona: number;

  @Column("varchar", {
    name: "obs_rleventopersona",
    nullable: true,
    length: 255,
  })
  obsRleventopersona: string | null;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

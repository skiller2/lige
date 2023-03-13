import { Column, Entity, Index } from "typeorm";

@Index("PK__evtpersonas__2685A772", ["idPersona"], { unique: true })
@Entity("evtpersonas", { schema: "dbo" })
export class Evtpersonas {
  @Column("bigint", { primary: true, name: "id_persona" })
  idPersona: string;

  @Column("varchar", { name: "nom_persona", length: 255 })
  nomPersona: string;

  @Column("varchar", { name: "ape_persona", length: 255 })
  apePersona: string;

  @Column("varchar", { name: "tel_persona", length: 255 })
  telPersona: string;

  @Column("varchar", { name: "mail_persona", nullable: true, length: 255 })
  mailPersona: string | null;

  @Column("int", { name: "ope_cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "stampa" })
  stampa: Date;
}

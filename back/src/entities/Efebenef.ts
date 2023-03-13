import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEBENEF", ["ebeBene", "ebeGp"], { unique: true })
@Entity("EFEBENEF", { schema: "dbo" })
export class Efebenef {
  @Column("varchar", { name: "ebe_UGL", nullable: true, length: 50 })
  ebeUgl: string | null;

  @Column("varchar", { primary: true, name: "ebe_BENE", length: 50 })
  ebeBene: string;

  @Column("varchar", { primary: true, name: "ebe_GP", length: 50 })
  ebeGp: string;

  @Column("varchar", { name: "ebe_D_APE_NOM", nullable: true, length: 50 })
  ebeDApeNom: string | null;

  @Column("varchar", { name: "ebe_T_DOCU", nullable: true, length: 50 })
  ebeTDocu: string | null;

  @Column("varchar", { name: "ebe_NRO_DOC", nullable: true, length: 50 })
  ebeNroDoc: string | null;

  @Column("varchar", { name: "ebe_N_CUIL", nullable: true, length: 50 })
  ebeNCuil: string | null;

  @Column("datetime", { name: "ebe_F_NACIMIENTO", nullable: true })
  ebeFNacimiento: Date | null;

  @Column("varchar", { name: "ebe_TELEDISC", nullable: true, length: 50 })
  ebeTeledisc: string | null;

  @Column("varchar", { name: "ebe_TEL", nullable: true, length: 50 })
  ebeTel: string | null;

  @Column("varchar", { name: "ebe_TIPO_DOM", nullable: true, length: 50 })
  ebeTipoDom: string | null;

  @Column("varchar", { name: "ebe_CALLE", nullable: true, length: 50 })
  ebeCalle: string | null;

  @Column("varchar", { name: "ebe_NRO_PUERTA", nullable: true, length: 50 })
  ebeNroPuerta: string | null;

  @Column("varchar", { name: "ebe_NRO_PUERTA_BIS", nullable: true, length: 50 })
  ebeNroPuertaBis: string | null;

  @Column("varchar", { name: "ebe_PISO", nullable: true, length: 50 })
  ebePiso: string | null;

  @Column("varchar", { name: "ebe_DEPTO", nullable: true, length: 50 })
  ebeDepto: string | null;

  @Column("varchar", { name: "ebe_C_POSTAL", nullable: true, length: 50 })
  ebeCPostal: string | null;

  @Column("varchar", { name: "ebe_CUGEO", nullable: true, length: 50 })
  ebeCugeo: string | null;

  @Column("varchar", {
    name: "ebe_MEDICO_CABECERA",
    nullable: true,
    length: 50,
  })
  ebeMedicoCabecera: string | null;

  @Column("int", { name: "ope_OPER", nullable: true })
  opeOper: number | null;

  @Column("datetime", {
    name: "ebe_STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  ebeStampa: Date | null;

  @Column("varchar", { name: "ebe_SEXO", nullable: true, length: 1 })
  ebeSexo: string | null;
}

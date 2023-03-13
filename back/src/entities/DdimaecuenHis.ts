import { Column, Entity, Index } from "typeorm";

@Index("PK_DDIMAECUEN_HIS", ["dmsCod"], { unique: true })
@Entity("DDIMAECUEN_HIS", { schema: "dbo" })
export class DdimaecuenHis {
  @Column("int", { primary: true, name: "dms_cod" })
  dmsCod: number;

  @Column("int", { name: "dmc_cod" })
  dmcCod: number;

  @Column("nvarchar", { name: "dms_cbu", nullable: true, length: 50 })
  dmsCbu: string | null;

  @Column("nvarchar", {
    name: "dms_nro_tarjeta",
    nullable: true,
    length: 50,
    default: () => "NULL",
  })
  dmsNroTarjeta: string | null;

  @Column("nvarchar", { name: "dms_banco", nullable: true, length: 255 })
  dmsBanco: string | null;

  @Column("nvarchar", { name: "dms_titular", nullable: true, length: 255 })
  dmsTitular: string | null;

  @Column("nvarchar", { name: "dms_cuit", nullable: true, length: 50 })
  dmsCuit: string | null;

  @Column("nvarchar", { name: "dms_nro_doc", nullable: true, length: 50 })
  dmsNroDoc: string | null;

  @Column("nvarchar", { name: "dms_telefono", nullable: true, length: 50 })
  dmsTelefono: string | null;

  @Column("nvarchar", { name: "dms_fax", nullable: true, length: 50 })
  dmsFax: string | null;

  @Column("nvarchar", { name: "dms_apelnom", nullable: true, length: 255 })
  dmsApelnom: string | null;

  @Column("nvarchar", { name: "dms_direccion", nullable: true, length: 255 })
  dmsDireccion: string | null;

  @Column("nvarchar", { name: "dms_codpos_ext", nullable: true, length: 20 })
  dmsCodposExt: string | null;

  @Column("nvarchar", { name: "dms_email", nullable: true, length: 255 })
  dmsEmail: string | null;

  @Column("int", { name: "dms_estado", nullable: true })
  dmsEstado: number | null;

  @Column("datetime", { name: "dms_fec_estado", nullable: true })
  dmsFecEstado: Date | null;

  @Column("int", { name: "dms_oper", nullable: true })
  dmsOper: number | null;

  @Column("datetime", { name: "dms_stampa", nullable: true })
  dmsStampa: Date | null;

  @Column("int", { name: "dms_tco_codeb", nullable: true })
  dmsTcoCodeb: number | null;

  @Column("int", { name: "dms_tco_inscol", nullable: true })
  dmsTcoInscol: number | null;

  @Column("int", { name: "dms_mco_nro", nullable: true })
  dmsMcoNro: number | null;

  @Column("int", { name: "dms_mfa_nro", nullable: true })
  dmsMfaNro: number | null;

  @Column("money", { name: "dms_impmax", nullable: true })
  dmsImpmax: number | null;

  @Column("money", { name: "dms_canmax", nullable: true })
  dmsCanmax: number | null;
}

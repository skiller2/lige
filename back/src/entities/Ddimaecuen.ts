import { Column, Entity, Index } from "typeorm";

@Index("PK_DDIMAECUEN", ["dmcCod"], { unique: true })
@Entity("DDIMAECUEN", { schema: "dbo" })
export class Ddimaecuen {
  @Column("int", { primary: true, name: "dmc_cod" })
  dmcCod: number;

  @Column("int", { name: "dmg_cod", nullable: true, default: () => "(1)" })
  dmgCod: number | null;

  @Column("nvarchar", { name: "dmc_cbu", nullable: true, length: 50 })
  dmcCbu: string | null;

  @Column("nvarchar", {
    name: "dmc_nro_tarjeta",
    nullable: true,
    length: 50,
    default: () => "NULL",
  })
  dmcNroTarjeta: string | null;

  @Column("nvarchar", { name: "dmc_banco", nullable: true, length: 255 })
  dmcBanco: string | null;

  @Column("nvarchar", { name: "dmc_titular", nullable: true, length: 255 })
  dmcTitular: string | null;

  @Column("nvarchar", { name: "dmc_cuit", nullable: true, length: 50 })
  dmcCuit: string | null;

  @Column("nvarchar", { name: "dmc_tipo_doc", nullable: true, length: 2 })
  dmcTipoDoc: string | null;

  @Column("nvarchar", { name: "dmc_nro_doc", nullable: true, length: 50 })
  dmcNroDoc: string | null;

  @Column("nvarchar", { name: "dmc_telefono", nullable: true, length: 50 })
  dmcTelefono: string | null;

  @Column("nvarchar", { name: "dmc_fax", nullable: true, length: 50 })
  dmcFax: string | null;

  @Column("nvarchar", { name: "dmc_apelnom", nullable: true, length: 255 })
  dmcApelnom: string | null;

  @Column("nvarchar", { name: "dmc_direccion", nullable: true, length: 255 })
  dmcDireccion: string | null;

  @Column("nvarchar", { name: "dmc_codpos_ext", nullable: true, length: 20 })
  dmcCodposExt: string | null;

  @Column("nvarchar", { name: "dmc_email", nullable: true, length: 255 })
  dmcEmail: string | null;

  @Column("int", { name: "dmc_estado", nullable: true })
  dmcEstado: number | null;

  @Column("datetime", { name: "dmc_fec_estado", nullable: true })
  dmcFecEstado: Date | null;

  @Column("ntext", { name: "dmc_observaciones", nullable: true })
  dmcObservaciones: string | null;

  @Column("int", { name: "dmc_oper", nullable: true })
  dmcOper: number | null;

  @Column("datetime", { name: "dmc_stampa", nullable: true })
  dmcStampa: Date | null;

  @Column("int", { name: "dmc_codpos", nullable: true })
  dmcCodpos: number | null;
}

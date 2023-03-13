import { Column, Entity, Index } from "typeorm";

@Index("PK_DDIMOVIMIENTOS_HIS", ["dmhCod"], { unique: true })
@Entity("DDIMOVIMIENTOS_HIS", { schema: "dbo" })
export class DdimovimientosHis {
  @Column("int", { primary: true, name: "dmh_cod" })
  dmhCod: number;

  @Column("int", { name: "dmh_grupo" })
  dmhGrupo: number;

  @Column("int", { name: "dmc_cod", nullable: true })
  dmcCod: number | null;

  @Column("nvarchar", { name: "dmc_cbu", nullable: true, length: 50 })
  dmcCbu: string | null;

  @Column("nvarchar", { name: "dmc_cuit", nullable: true, length: 50 })
  dmcCuit: string | null;

  @Column("nvarchar", { name: "dmc_nro_tarjeta", nullable: true, length: 50 })
  dmcNroTarjeta: string | null;

  @Column("int", { name: "dmg_cod", nullable: true })
  dmgCod: number | null;

  @Column("int", { name: "tco_inscol", nullable: true })
  tcoInscol: number | null;

  @Column("int", { name: "tco_codeb", nullable: true })
  tcoCodeb: number | null;

  @Column("int", { name: "mco_nro", nullable: true })
  mcoNro: number | null;

  @Column("int", { name: "mfa_nro", nullable: true })
  mfaNro: number | null;

  @Column("int", { name: "dmh_anio", nullable: true })
  dmhAnio: number | null;

  @Column("int", { name: "dmh_mes", nullable: true })
  dmhMes: number | null;

  @Column("money", { name: "dmh_importe", nullable: true })
  dmhImporte: number | null;

  @Column("datetime", { name: "dmh_fecgen", nullable: true })
  dmhFecgen: Date | null;

  @Column("datetime", { name: "dmh_fecpag", nullable: true })
  dmhFecpag: Date | null;

  @Column("int", { name: "dmh_oper", nullable: true })
  dmhOper: number | null;

  @Column("datetime", { name: "dmh_stampa", nullable: true })
  dmhStampa: Date | null;

  @Column("varchar", { name: "dmh_retorno_bco", nullable: true, length: 50 })
  dmhRetornoBco: string | null;

  @Column("varchar", {
    name: "dmh_retorno_detalle",
    nullable: true,
    length: 255,
  })
  dmhRetornoDetalle: string | null;

  @Column("int", { name: "dmh_flag_orig", nullable: true })
  dmhFlagOrig: number | null;
}

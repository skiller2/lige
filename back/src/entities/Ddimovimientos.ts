import { Column, Entity, Index } from "typeorm";

@Index(
  "IX_DDIMOVIMIENTOS",
  ["tcoCodeb", "mcoNro", "mfaNro", "dmoAnio", "dmoMes"],
  { unique: true }
)
@Index("PK_DDIMOVIMIENTOS", ["dmoCod"], { unique: true })
@Entity("DDIMOVIMIENTOS", { schema: "dbo" })
export class Ddimovimientos {
  @Column("int", { primary: true, name: "dmo_cod" })
  dmoCod: number;

  @Column("int", { name: "dmc_cod", nullable: true })
  dmcCod: number | null;

  @Column("int", { name: "dmg_cod", nullable: true })
  dmgCod: number | null;

  @Column("int", { name: "tco_inscol", nullable: true })
  tcoInscol: number | null;

  @Column("int", { name: "tco_codeb", nullable: true, unique: true })
  tcoCodeb: number | null;

  @Column("int", { name: "mco_nro", nullable: true, unique: true })
  mcoNro: number | null;

  @Column("int", { name: "mfa_nro", nullable: true, unique: true })
  mfaNro: number | null;

  @Column("int", { name: "dmo_anio", nullable: true, unique: true })
  dmoAnio: number | null;

  @Column("int", { name: "dmo_mes", nullable: true, unique: true })
  dmoMes: number | null;

  @Column("money", { name: "dmo_importe" })
  dmoImporte: number;

  @Column("datetime", { name: "dmo_fecgen", nullable: true })
  dmoFecgen: Date | null;

  @Column("datetime", { name: "dmo_fecpag", nullable: true })
  dmoFecpag: Date | null;

  @Column("int", { name: "dmo_oper", nullable: true })
  dmoOper: number | null;

  @Column("datetime", { name: "dmo_stampa", nullable: true })
  dmoStampa: Date | null;

  @Column("varchar", { name: "dmo_retorno", nullable: true, length: 50 })
  dmoRetorno: string | null;

  @Column("varchar", {
    name: "dmo_retorno_detalle",
    nullable: true,
    length: 255,
  })
  dmoRetornoDetalle: string | null;

  @Column("int", {
    name: "dmo_flag_orig",
    nullable: true,
    default: () => "(0)",
  })
  dmoFlagOrig: number | null;

  @Column("int", { name: "dmo_proceso_previo", nullable: true })
  dmoProcesoPrevio: number | null;

  @Column("int", { name: "dad_cod", nullable: true })
  dadCod: number | null;

  @Column("nvarchar", {
    name: "dmc_nro_tarjeta_nue",
    nullable: true,
    length: 50,
  })
  dmcNroTarjetaNue: string | null;
}

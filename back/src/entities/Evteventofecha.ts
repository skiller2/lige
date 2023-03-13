import { Column, Entity, Index } from "typeorm";

@Index("PK__evteventofecha__22B5168E", ["denEvento", "nroEvento"], {
  unique: true,
})
@Entity("evteventofecha", { schema: "dbo" })
export class Evteventofecha {
  @Column("int", { primary: true, name: "den_evento" })
  denEvento: number;

  @Column("int", { primary: true, name: "nro_evento" })
  nroEvento: number;

  @Column("varchar", { name: "des_eventofecha", nullable: true, length: 255 })
  desEventofecha: string | null;

  @Column("datetime", { name: "fec_inievento" })
  fecInievento: Date;

  @Column("datetime", { name: "fec_finevento" })
  fecFinevento: Date;

  @Column("varchar", { name: "obs_evento", nullable: true, length: 4096 })
  obsEvento: string | null;

  @Column("money", { name: "imp_total" })
  impTotal: number;

  @Column("money", { name: "imp_pago" })
  impPago: number;

  @Column("int", { name: "can_min_inscriptos" })
  canMinInscriptos: number;

  @Column("int", { name: "ope_cod" })
  opeCod: number;

  @Column("datetime", { name: "stampa" })
  stampa: Date;

  @Column("int", {
    name: "ind_cancelado",
    nullable: true,
    default: () => "'0'",
  })
  indCancelado: number | null;
}

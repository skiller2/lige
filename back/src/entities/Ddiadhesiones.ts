import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";

@Index("IX_DDIADHESIONES_1", ["tcoCodeb", "mcoNro", "mfaNro"], { unique: true })
@Index("PK_DDIADHESIONES", ["dadCod"], { unique: true })
@Entity("DDIADHESIONES", { schema: "dbo" })
export class Ddiadhesiones {
  @Column("int", { primary: true, name: "dad_cod" })
  dadCod: number;

  @Column("int", { name: "dmc_cod", nullable: true })
  dmcCod: number | null;

  @Column("int", { name: "tco_codeb", nullable: true, unique: true })
  tcoCodeb: number | null;

  @Column("int", { name: "tco_inscol", nullable: true })
  tcoInscol: number | null;

  @Column("int", { name: "mco_nro", nullable: true, unique: true })
  mcoNro: number | null;

  @Column("int", { name: "mfa_nro", nullable: true, unique: true })
  mfaNro: number | null;

  @Column("money", { name: "dad_impmax", nullable: true })
  dadImpmax: number | null;

  @Column("int", { name: "dad_canmax", nullable: true })
  dadCanmax: number | null;

  @Column("int", { name: "dad_estado", nullable: true })
  dadEstado: number | null;

  @Column("int", { name: "dad_oper", nullable: true })
  dadOper: number | null;

  @Column("datetime", { name: "dad_stampa", nullable: true })
  dadStampa: Date | null;

  @Column("int", { name: "dad_proceso_previo", nullable: true })
  dadProcesoPrevio: number | null;

  @OneToOne(() => Ddiadhesiones, (ddiadhesiones) => ddiadhesiones.ddiadhesiones)
  @JoinColumn([{ name: "dad_cod", referencedColumnName: "dadCod" }])
  dadCod2: Ddiadhesiones;

  @OneToOne(() => Ddiadhesiones, (ddiadhesiones) => ddiadhesiones.dadCod2)
  ddiadhesiones: Ddiadhesiones;
}

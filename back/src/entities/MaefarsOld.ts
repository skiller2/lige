import { Column, Entity, Index } from "typeorm";

@Index("PK___3__13", ["farnro", "cod"], { unique: true })
@Entity("MAEFARS_OLD", { schema: "dbo" })
export class MaefarsOld {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("varchar", { name: "FNOMBRE", nullable: true, length: 100 })
  fnombre: string | null;

  @Column("int", { name: "NROCOLE", nullable: true })
  nrocole: number | null;

  @Column("varchar", { name: "FRAZON", nullable: true, length: 100 })
  frazon: string | null;

  @Column("int", { name: "FTURNO", nullable: true })
  fturno: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { primary: true, name: "FARNRO" })
  farnro: number;

  @Column("varchar", { name: "FORDENCH", nullable: true, length: 100 })
  fordench: string | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "MFA_FARMPRES", nullable: true })
  mfaFarmpres: number | null;

  @Column("datetime", { name: "MFA_AUD_FEC", nullable: true })
  mfaAudFec: Date | null;

  @Column("int", { name: "MFA_AUD_NROCOL", nullable: true })
  mfaAudNrocol: number | null;

  @Column("int", { name: "MFA_AUD_FARMPRES", nullable: true })
  mfaAudFarmpres: number | null;

  @Column("int", { name: "MAU_COD", nullable: true })
  mauCod: number | null;

  @Column("int", { name: "MFA_AUD_CDESCARGO", nullable: true })
  mfaAudCdescargo: number | null;

  @Column("varchar", { name: "MFA_AUD_OBSERVAC", nullable: true, length: 500 })
  mfaAudObservac: string | null;

  @Column("varchar", { name: "MFA_DEP_CBU", nullable: true, length: 50 })
  mfaDepCbu: string | null;

  @Column("varchar", { name: "MFA_DEP_CUIT", nullable: true, length: 50 })
  mfaDepCuit: string | null;

  @Column("varchar", { name: "MFA_DEP_NOMBRE", nullable: true, length: 255 })
  mfaDepNombre: string | null;

  @Column("varchar", { name: "DPA_COD", nullable: true, length: 3 })
  dpaCod: string | null;
}

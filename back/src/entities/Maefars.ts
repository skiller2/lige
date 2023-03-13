import { Column, Entity, Index } from "typeorm";

@Index("PK_FARNRO", ["farnro"], { unique: true })
@Index("PorNOmbre", ["fnombre", "farnro"], {})
@Index("PorNroPAMI", ["farnro", "fnropami"], {})
@Entity("MAEFARS", { schema: "dbo" })
export class Maefars {
  @Column("int", { primary: true, name: "FARNRO" })
  farnro: number;

  @Column("varchar", { name: "NROCUIT", nullable: true, length: 11 })
  nrocuit: string | null;

  @Column("varchar", { name: "FNOMBRE", nullable: true, length: 30 })
  fnombre: string | null;

  @Column("varchar", { name: "FNROPAMI", nullable: true, length: 10 })
  fnropami: string | null;

  @Column("int", { name: "nrocole", nullable: true })
  nrocole: number | null;

  @Column("varchar", { name: "FRAZON", nullable: true, length: 50 })
  frazon: string | null;

  @Column("varchar", { name: "FTIPOSOCCHAR", nullable: true, length: 50 })
  ftiposocchar: string | null;

  @Column("varchar", { name: "FCALLECHAR", nullable: true, length: 50 })
  fcallechar: string | null;

  @Column("int", { name: "FNUMERO", nullable: true })
  fnumero: number | null;

  @Column("int", { name: "FCODPOS", nullable: true })
  fcodpos: number | null;

  @Column("varchar", { name: "FTELEFONO", nullable: true, length: 40 })
  ftelefono: string | null;

  @Column("int", { name: "FSECPOL", nullable: true, default: () => "(0)" })
  fsecpol: number | null;

  @Column("int", { name: "FTURNO", nullable: true, default: () => "(0)" })
  fturno: number | null;

  @Column("varchar", { name: "FORDENCH", nullable: true, length: 50 })
  fordench: string | null;

  @Column("varchar", { name: "FNROHABIL", nullable: true, length: 20 })
  fnrohabil: string | null;

  @Column("datetime", { name: "FALTA", nullable: true })
  falta: Date | null;

  @Column("datetime", { name: "FBAJA", nullable: true })
  fbaja: Date | null;

  @Column("varchar", { name: "NROIOMA", nullable: true, length: 30 })
  nroioma: string | null;

  @Column("int", { name: "ADOSME", nullable: true })
  adosme: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "NROINGBR", nullable: true, length: 30 })
  nroingbr: string | null;

  @Column("int", { name: "FZONA", nullable: true })
  fzona: number | null;

  @Column("int", { name: "FCALLE", nullable: true, default: () => "(0)" })
  fcalle: number | null;

  @Column("int", { name: "FTIPOSOC", nullable: true, default: () => "(0)" })
  ftiposoc: number | null;

  @Column("varchar", {
    name: "FLOCALIDAD",
    nullable: true,
    length: 50,
    default: () => "'CAPITAL FEDERAL'",
  })
  flocalidad: string | null;

  @Column("varchar", { name: "FFAX", nullable: true, length: 40 })
  ffax: string | null;

  @Column("int", { name: "TIPOFAR", nullable: true, default: () => "(1)" })
  tipofar: number | null;

  @Column("int", { name: "NRODROG", nullable: true })
  nrodrog: number | null;

  @Column("int", { name: "FCODZONA", nullable: true, default: () => "(0)" })
  fcodzona: number | null;

  @Column("int", { name: "MAU_COD", nullable: true, default: () => "(0)" })
  mauCod: number | null;

  @Column("datetime", { name: "MFA_AUD_FEC", nullable: true })
  mfaAudFec: Date | null;

  @Column("varchar", { name: "MFA_EMAIL", nullable: true, length: 50 })
  mfaEmail: string | null;

  @Column("int", { name: "mba_cod", nullable: true })
  mbaCod: number | null;

  @Column("varchar", { name: "MFA_OBSERV", nullable: true, length: 500 })
  mfaObserv: string | null;

  @Column("int", { name: "MFA_RECMAG", nullable: true })
  mfaRecmag: number | null;

  @Column("int", { name: "MFA_VACUNAT", nullable: true })
  mfaVacunat: number | null;

  @Column("int", { name: "MFA_RECHOM", nullable: true })
  mfaRechom: number | null;

  @Column("int", { name: "MFA_PREART", nullable: true })
  mfaPreart: number | null;

  @Column("int", { name: "MFA_FARMPRES", nullable: true })
  mfaFarmpres: number | null;

  @Column("int", { name: "MFA_AUD_NROCOL", nullable: true })
  mfaAudNrocol: number | null;

  @Column("int", { name: "MFA_AUD_FARMPRES", nullable: true })
  mfaAudFarmpres: number | null;

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

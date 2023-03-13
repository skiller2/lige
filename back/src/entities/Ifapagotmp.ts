import { Column, Entity, Index } from "typeorm";

@Index("PK_IFAPAGOTMP", ["coduni"], { unique: true })
@Entity("IFAPAGOTMP", { schema: "dbo" })
export class Ifapagotmp {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR", default: () => "(0)" })
  nrofar: number;

  @Column("varchar", { name: "NOMBRE", length: 100 })
  nombre: string;

  @Column("int", { name: "DIA", nullable: true, default: () => "(1)" })
  dia: number | null;

  @Column("int", { name: "MES", nullable: true, default: () => "(1)" })
  mes: number | null;

  @Column("int", { name: "ANIO", nullable: true, default: () => "(1996)" })
  anio: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "(0)" })
  importe: number | null;

  @Column("varchar", { name: "MFA_EMAIL", nullable: true, length: 50 })
  mfaEmail: string | null;

  @Column("varchar", { name: "FORDENCH", nullable: true, length: 100 })
  fordench: string | null;

  @Column("varchar", { name: "MFA_DEP_CUIT", nullable: true, length: 11 })
  mfaDepCuit: string | null;

  @Column("varchar", { name: "MFA_DEP_CBU", nullable: true, length: 50 })
  mfaDepCbu: string | null;

  @Column("varchar", { name: "MFA_DEP_NOMBRE", nullable: true, length: 255 })
  mfaDepNombre: string | null;

  @Column("int", { name: "NROCHE", nullable: true })
  nroche: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "CODBCOCU", nullable: true })
  codbcocu: number | null;

  @Column("varchar", { name: "DPA_COD", nullable: true, length: 3 })
  dpaCod: string | null;

  @Column("int", { name: "IFA_DEP_MISMO_BANCO", nullable: true })
  ifaDepMismoBanco: number | null;

  @Column("varchar", { name: "IFA_CUE_TIPO", nullable: true, length: 1 })
  ifaCueTipo: string | null;

  @Column("varchar", { name: "IFA_CUE_SUCURSAL", nullable: true, length: 3 })
  ifaCueSucursal: string | null;

  @Column("varchar", { name: "IFA_CUE_NRO", nullable: true, length: 7 })
  ifaCueNro: string | null;

  @Column("varchar", { name: "IFA_CUE_NRO_DV", nullable: true, length: 1 })
  ifaCueNroDv: string | null;

  @Column("int", { name: "IFA_PROCESO_IND", nullable: true })
  ifaProcesoInd: number | null;

  @Column("datetime", { name: "IFA_FEC_IMPUT", nullable: true })
  ifaFecImput: Date | null;
}

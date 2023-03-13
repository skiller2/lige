import { Column, Entity, Index } from "typeorm";

@Index("PK_MAECOLE_1__14", ["nrocol"], { unique: true })
@Index("PORNROCOLFECBAJ", ["nrocol", "fecbaja"], {})
@Entity("MAECOLE", { schema: "dbo" })
export class Maecole {
  @Column("int", { primary: true, name: "NROCOL" })
  nrocol: number;

  @Column("int", { name: "MATNAC", nullable: true })
  matnac: number | null;

  @Column("int", { name: "MATCOL", nullable: true })
  matcol: number | null;

  @Column("int", { name: "FOB", nullable: true })
  fob: number | null;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;

  @Column("varchar", { name: "APELNOMB", nullable: true, length: 255 })
  apelnomb: string | null;

  @Column("int", { name: "DPCALLE", nullable: true, default: () => "0" })
  dpcalle: number | null;

  @Column("int", { name: "DPNRO", nullable: true, default: () => "0" })
  dpnro: number | null;

  @Column("varchar", { name: "DPOTROS", nullable: true, length: 20 })
  dpotros: string | null;

  @Column("int", { name: "DPCODPOS", nullable: true })
  dpcodpos: number | null;

  @Column("varchar", { name: "DPLOCAL", nullable: true, length: 30 })
  dplocal: string | null;

  @Column("varchar", { name: "DPTEL", nullable: true, length: 20 })
  dptel: string | null;

  @Column("varchar", { name: "DPFAX", nullable: true, length: 20 })
  dpfax: string | null;

  @Column("int", { name: "mba_cod_dp", nullable: true, default: () => "0" })
  mbaCodDp: number | null;

  @Column("varchar", { name: "DPBARR", nullable: true, length: 20 })
  dpbarr: string | null;

  @Column("int", { name: "DCCALLE", nullable: true, default: () => "0" })
  dccalle: number | null;

  @Column("int", { name: "DCNRO", nullable: true, default: () => "0" })
  dcnro: number | null;

  @Column("varchar", { name: "DCOTROS", nullable: true, length: 20 })
  dcotros: string | null;

  @Column("int", { name: "DCCODPOS", nullable: true })
  dccodpos: number | null;

  @Column("varchar", { name: "DCLOCAL", nullable: true, length: 30 })
  dclocal: string | null;

  @Column("varchar", { name: "DCTEL", nullable: true, length: 20 })
  dctel: string | null;

  @Column("varchar", { name: "DCBARR", nullable: true, length: 20 })
  dcbarr: string | null;

  @Column("varchar", { name: "DCFAX", nullable: true, length: 20 })
  dcfax: string | null;

  @Column("int", { name: "mba_cod_dc", nullable: true, default: () => "0" })
  mbaCodDc: number | null;

  @Column("datetime", { name: "FECNAC", nullable: true })
  fecnac: Date | null;

  @Column("varchar", { name: "SEXO", nullable: true, length: 1 })
  sexo: string | null;

  @Column("varchar", { name: "ESTCIV", nullable: true, length: 1 })
  estciv: string | null;

  @Column("varchar", { name: "TIPDOC", nullable: true, length: 2 })
  tipdoc: string | null;

  @Column("varchar", { name: "NRODOC", nullable: true, length: 10 })
  nrodoc: string | null;

  @Column("varchar", { name: "NACIONAL", nullable: true, length: 1 })
  nacional: string | null;

  @Column("datetime", { name: "FECALTA", nullable: true })
  fecalta: Date | null;

  @Column("datetime", { name: "FECBAJA", nullable: true })
  fecbaja: Date | null;

  @Column("int", { name: "MOTBAJ", nullable: true })
  motbaj: number | null;

  @Column("datetime", { name: "FECREH", nullable: true })
  fecreh: Date | null;

  @Column("int", { name: "UNITRAB1", nullable: true, default: () => "0" })
  unitrab1: number | null;

  @Column("varchar", { name: "CUIT", nullable: true, length: 14 })
  cuit: string | null;

  @Column("int", { name: "EXENTO", nullable: true })
  exento: number | null;

  @Column("varchar", { name: "NROAUTON", nullable: true, length: 11 })
  nroauton: string | null;

  @Column("int", { name: "ESTADO", nullable: true, default: () => "0" })
  estado: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "TIPODEB", nullable: true, default: () => "3" })
  tipodeb: number | null;

  @Column("datetime", { name: "FECRECIB", nullable: true })
  fecrecib: Date | null;

  @Column("int", { name: "PROP", nullable: true, default: () => "0" })
  prop: number | null;

  @Column("int", { name: "CODZONA", nullable: true, default: () => "0" })
  codzona: number | null;

  @Column("int", { name: "MAU_COD", nullable: true, default: () => "0" })
  mauCod: number | null;

  @Column("datetime", { name: "MCO_AUD_FEC", nullable: true })
  mcoAudFec: Date | null;

  @Column("varchar", { name: "MCO_EMAIL", nullable: true, length: 50 })
  mcoEmail: string | null;

  @Column("varchar", { name: "MCO_OBSERV", nullable: true, length: 500 })
  mcoObserv: string | null;

  @Column("int", { name: "MCO_CURVAC", nullable: true })
  mcoCurvac: number | null;

  @Column("varchar", { name: "MCO_EMAIL2", nullable: true, length: 50 })
  mcoEmail2: string | null;

  @Column("image", { name: "MCO_FOTO_CARNET", nullable: true })
  mcoFotoCarnet: Buffer | null;
}

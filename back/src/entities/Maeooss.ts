import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEOOSS_1__12", ["codooss"], { unique: true })
@Entity("MAEOOSS", { schema: "dbo" })
export class Maeooss {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 40 })
  nombre: string | null;

  @Column("varchar", { name: "DOMICILIO", nullable: true, length: 100 })
  domicilio: string | null;

  @Column("varchar", { name: "LOCALIDAD", nullable: true, length: 100 })
  localidad: string | null;

  @Column("varchar", { name: "CODPOS", nullable: true, length: 4 })
  codpos: string | null;

  @Column("varchar", { name: "TELEFONOS", nullable: true, length: 100 })
  telefonos: string | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 30 })
  fax: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "TIPOPRE", nullable: true })
  tipopre: number | null;

  @Column("smallint", { name: "TOT_FAC", nullable: true })
  totFac: number | null;

  @Column("smallint", { name: "TOT_AC", nullable: true })
  totAc: number | null;

  @Column("smallint", { name: "TOT_BONIF", nullable: true })
  totBonif: number | null;

  @Column("smallint", { name: "TOT_REIN", nullable: true })
  totRein: number | null;

  @Column("smallint", { name: "CAN_LOTES", nullable: true })
  canLotes: number | null;

  @Column("smallint", { name: "CAN_UNIDADES", nullable: true })
  canUnidades: number | null;

  @Column("smallint", { name: "CAN_RECETAS", nullable: true })
  canRecetas: number | null;

  @Column("smallint", { name: "CAN_PRODUCT", nullable: true })
  canProduct: number | null;

  @Column("smallint", { name: "CAROSVAR", nullable: true })
  carosvar: number | null;

  @Column("varchar", { name: "OSNROCUIT", nullable: true, length: 20 })
  osnrocuit: string | null;

  @Column("int", { name: "MOVACUEN", nullable: true })
  movacuen: number | null;

  @Column("int", { name: "ACTIVA", nullable: true })
  activa: number | null;

  @Column("smallint", { name: "FON_FIDUC", nullable: true, default: () => "0" })
  fonFiduc: number | null;
}

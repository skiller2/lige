import { Column, Entity, Index } from "typeorm";

@Index("PK_AGEEMP_1__16", ["empcod"], { unique: true })
@Entity("AGEEMP", { schema: "dbo" })
export class Ageemp {
  @Column("int", { primary: true, name: "EMPCOD" })
  empcod: number;

  @Column("varchar", { name: "NOMBRE", length: 100 })
  nombre: string;

  @Column("varchar", { name: "OTRO", nullable: true, length: 20 })
  otro: string | null;

  @Column("varchar", { name: "TEL", nullable: true, length: 30 })
  tel: string | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 30 })
  fax: string | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "LOCA", nullable: true, length: 255 })
  loca: string | null;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("varchar", { name: "PROVINCIA", nullable: true, length: 255 })
  provincia: string | null;

  @Column("smallint", { name: "COMPARTIDO", nullable: true })
  compartido: number | null;

  @Column("int", { name: "NRO", nullable: true })
  nro: number | null;

  @Column("int", { name: "CALLE", nullable: true })
  calle: number | null;
}

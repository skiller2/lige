import { Column, Entity, Index } from "typeorm";

@Index("PK_AGEPART_1__16", ["cod"], { unique: true })
@Entity("AGEPART", { schema: "dbo" })
export class Agepart {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("varchar", { name: "NOMBRE", length: 255 })
  nombre: string;

  @Column("int", { name: "CALLE", nullable: true })
  calle: number | null;

  @Column("int", { name: "NRO", nullable: true })
  nro: number | null;

  @Column("varchar", { name: "OTRO", nullable: true, length: 40 })
  otro: string | null;

  @Column("varchar", { name: "TEL", nullable: true, length: 40 })
  tel: string | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 40 })
  fax: string | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "OPER" })
  oper: number;

  @Column("datetime", { name: "STAMPA" })
  stampa: Date;

  @Column("varchar", { name: "LOCA", nullable: true, length: 40 })
  loca: string | null;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("varchar", { name: "PROVINCIA", nullable: true, length: 40 })
  provincia: string | null;

  @Column("smallint", { name: "COMPARTIDO", nullable: true })
  compartido: number | null;
}

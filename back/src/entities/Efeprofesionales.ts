import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEPROFESIONALES", ["eprMatnac"], { unique: true })
@Entity("EFEPROFESIONALES", { schema: "dbo" })
export class Efeprofesionales {
  @Column("int", { primary: true, name: "epr_MATNAC" })
  eprMatnac: number;

  @Column("varchar", { name: "epr_APELNOMB", nullable: true, length: 255 })
  eprApelnomb: string | null;

  @Column("varchar", { name: "epr_CODPRESPAMI", nullable: true, length: 255 })
  eprCodprespami: string | null;

  @Column("int", { name: "epr_CUPO", nullable: true })
  eprCupo: number | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "epr_STAMPA", nullable: true })
  eprStampa: Date | null;
}

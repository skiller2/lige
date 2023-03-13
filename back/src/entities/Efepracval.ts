import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEPRACVAL", ["evaCodPami"], { unique: true })
@Entity("EFEPRACVAL", { schema: "dbo" })
export class Efepracval {
  @Column("nchar", { primary: true, name: "eva_cod_pami", length: 10 })
  evaCodPami: string;

  @Column("int", { name: "eva_cod_bioq", nullable: true })
  evaCodBioq: number | null;

  @Column("float", { name: "eva_nivel", precision: 53, default: () => "0" })
  evaNivel: number;

  @Column("varchar", { name: "eva_descrip", nullable: true, length: 255 })
  evaDescrip: string | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "eva_Stampa", nullable: true })
  evaStampa: Date | null;

  @Column("int", { name: "eva_nivel_pami", nullable: true })
  evaNivelPami: number | null;
}

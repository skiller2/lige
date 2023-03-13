import { Column, Entity, Index } from "typeorm";

@Index("PK_EFENOMENC", ["enoCodigo"], { unique: true })
@Entity("EFENOMENC", { schema: "dbo" })
export class Efenomenc {
  @Column("nchar", { primary: true, name: "eno_codigo", length: 10 })
  enoCodigo: string;

  @Column("varchar", { name: "eno_descrip", length: 255 })
  enoDescrip: string;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "eno_Stampa", nullable: true })
  enoStampa: Date | null;

  @Column("int", { name: "eno_cod", nullable: true })
  enoCod: number | null;
}

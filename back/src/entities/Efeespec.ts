import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEESPEC", ["eesCod"], { unique: true })
@Entity("EFEESPEC", { schema: "dbo" })
export class Efeespec {
  @Column("nchar", { primary: true, name: "ees_Cod", length: 4 })
  eesCod: string;

  @Column("varchar", { name: "ees_Descrip", nullable: true, length: 100 })
  eesDescrip: string | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", {
    name: "ees_Stampa",
    nullable: true,
    default: () => "getdate()",
  })
  eesStampa: Date | null;
}

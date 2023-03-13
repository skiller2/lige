import { Column, Entity, Index } from "typeorm";

@Index("PK_MAECATEGOR_1__10", ["codcateg"], { unique: true })
@Entity("MAECATEGOR", { schema: "dbo" })
export class Maecategor {
  @Column("int", { primary: true, name: "CODCATEG" })
  codcateg: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("int", { name: "CLASE", nullable: true })
  clase: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

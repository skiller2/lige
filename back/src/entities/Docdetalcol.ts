import { Column, Entity, Index } from "typeorm";

@Index("PK___16__10", ["coddoc"], { unique: true })
@Entity("DOCDETALCOL", { schema: "dbo" })
export class Docdetalcol {
  @Column("int", { primary: true, name: "CODDOC" })
  coddoc: number;

  @Column("int", { name: "CODREG", nullable: true })
  codreg: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("datetime", { name: "FECVEN", nullable: true })
  fecven: Date | null;

  @Column("int", { name: "FLAG", nullable: true })
  flag: number | null;

  @Column("datetime", { name: "FECHAFLAG", nullable: true })
  fechaflag: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "TIPOCAN", nullable: true })
  tipocan: number | null;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;
}

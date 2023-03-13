import { Column, Entity, Index } from "typeorm";

@Index("PK_ABODETALCOL_1__19", ["codreg"], { unique: true })
@Entity("ABODETALCOL", { schema: "dbo" })
export class Abodetalcol {
  @Column("int", { primary: true, name: "CODREG" })
  codreg: number;

  @Column("int", { name: "CODCON", nullable: true })
  codcon: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "CODCUOTA", nullable: true })
  codcuota: number | null;

  @Column("int", { name: "FLAG", nullable: true })
  flag: number | null;

  @Column("datetime", { name: "FECHAFLAG", nullable: true })
  fechaflag: Date | null;

  @Column("int", { name: "TIPOCAN", nullable: true })
  tipocan: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;

  @Column("int", { name: "ID_DEBMOV", nullable: true })
  idDebmov: number | null;
}

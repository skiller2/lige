import { Column, Entity, Index } from "typeorm";

@Index("PARADEBFAR", ["codeb", "anio", "mes"], {})
@Index("PK___3__22COL", ["id"], { unique: true })
@Index("PORCODEB", ["codeb", "nrocol", "flag"], {})
@Entity("DEBMOVICOL", { schema: "dbo" })
export class Debmovicol {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "FLAG", nullable: true, default: () => "0" })
  flag: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CODCUOTA", nullable: true })
  codcuota: number | null;

  @Column("int", { name: "CATEG", nullable: true })
  categ: number | null;

  @Column("int", { name: "TIPCOBR", nullable: true, default: () => "3" })
  tipcobr: number | null;

  @Column("int", { name: "FARMCOBR", nullable: true })
  farmcobr: number | null;

  @Column("datetime", { name: "FECHAFLAG", nullable: true })
  fechaflag: Date | null;

  @Column("int", { name: "RECIBO", nullable: true, default: () => "0" })
  recibo: number | null;

  @Column("int", { name: "COPER", nullable: true, default: () => "0" })
  coper: number | null;

  @Column("int", { name: "NROCOM", nullable: true })
  nrocom: number | null;
}

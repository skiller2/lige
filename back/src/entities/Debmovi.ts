import { Column, Entity, Index } from "typeorm";

@Index("PK___3__22", ["id"], { unique: true })
@Entity("DEBMOVI", { schema: "dbo" })
export class Debmovi {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

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

  @Column("datetime", { name: "FECHAFLAG", nullable: true })
  fechaflag: Date | null;

  @Column("int", { name: "RECIBO", nullable: true })
  recibo: number | null;

  @Column("int", { name: "COPER", nullable: true })
  coper: number | null;

  @Column("int", { name: "NROFACT", nullable: true })
  nrofact: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_RECIBOSH_1__16", ["coduni"], { unique: true })
@Index("PorNROREC", ["nrorec", "coduni"], {})
@Entity("RECIBOSH", { schema: "dbo" })
export class Recibosh {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROREC" })
  nrorec: number;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "COPER", nullable: true })
  coper: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CANT", nullable: true })
  cant: number | null;

  @Column("money", { name: "IMPOUNI", nullable: true })
  impouni: number | null;
}

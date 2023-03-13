import { Column, Entity, Index } from "typeorm";

@Index("PK___1__15", ["cobcuota"], { unique: true })
@Entity("COBCUOTADES", { schema: "dbo" })
export class Cobcuotades {
  @Column("int", { primary: true, name: "COBCUOTA" })
  cobcuota: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 40 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "STAMPA", nullable: true })
  stampa: number | null;
}

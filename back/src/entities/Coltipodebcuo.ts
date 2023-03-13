import { Column, Entity, Index } from "typeorm";

@Index("PK_TIPODEB", ["cobcuota"], { unique: true })
@Entity("COLTIPODEBCUO", { schema: "dbo" })
export class Coltipodebcuo {
  @Column("int", { primary: true, name: "COBCUOTA" })
  cobcuota: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 40 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "BORRAR", nullable: true })
  borrar: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

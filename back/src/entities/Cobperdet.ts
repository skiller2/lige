import { Column, Entity, Index } from "typeorm";

@Index("PK_COBPERDET_1__48", ["percob"], { unique: true })
@Entity("COBPERDET", { schema: "dbo" })
export class Cobperdet {
  @Column("int", { primary: true, name: "PERCOB" })
  percob: number;

  @Column("datetime", { name: "FECENT", nullable: true })
  fecent: Date | null;

  @Column("int", { name: "BORRAR", nullable: true })
  borrar: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CANREC", nullable: true })
  canrec: number | null;

  @Column("money", { name: "TOTIMP", nullable: true })
  totimp: number | null;

  @Column("datetime", { name: "FECVEN", nullable: true })
  fecven: Date | null;
}

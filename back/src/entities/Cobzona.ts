import { Column, Entity, Index } from "typeorm";

@Index("PK___3__24", ["codzona"], { unique: true })
@Entity("COBZONA", { schema: "dbo" })
export class Cobzona {
  @Column("int", { primary: true, name: "CODZONA" })
  codzona: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("int", { name: "CODCOB", default: () => "0" })
  codcob: number;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

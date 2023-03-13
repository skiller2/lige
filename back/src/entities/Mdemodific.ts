import { Column, Entity, Index } from "typeorm";

@Index("PK_MDEMODIFIC", ["control"], { unique: true })
@Entity("MDEMODIFIC", { schema: "dbo" })
export class Mdemodific {
  @Column("int", { primary: true, name: "CONTROL" })
  control: number;

  @Column("int", { name: "OPERAC", nullable: true })
  operac: number | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 255 })
  observ: string | null;

  @Column("money", { name: "DIFEREN", nullable: true })
  diferen: number | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

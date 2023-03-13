import { Column, Entity, Index } from "typeorm";

@Index("PK_ABOPRINCOL_1__19", ["codcon"], { unique: true })
@Entity("ABOPRINCOL", { schema: "dbo" })
export class Aboprincol {
  @Column("int", { primary: true, name: "CODCON" })
  codcon: number;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("int", { name: "ESTADO", nullable: true })
  estado: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("varchar", { name: "OBSERV", nullable: true, length: 255 })
  observ: string | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___15__10", ["codreg"], { unique: true })
@Entity("DOCPRINCOL", { schema: "dbo" })
export class Docprincol {
  @Column("int", { primary: true, name: "CODREG" })
  codreg: number;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "NROCOL", nullable: true })
  nrocol: number | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;
}

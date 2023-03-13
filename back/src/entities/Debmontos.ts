import { Column, Entity, Index } from "typeorm";

@Index("PK_DEBMONTOS_1__18", ["id"], { unique: true })
@Entity("DEBMONTOS", { schema: "dbo" })
export class Debmontos {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "CODEB", nullable: true, default: () => "0" })
  codeb: number | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("datetime", {
    name: "FECHA",
    nullable: true,
    default: () => "convert(varchar(12),getdate())",
  })
  fecha: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "FLAG", nullable: true, default: () => "0" })
  flag: number | null;
}

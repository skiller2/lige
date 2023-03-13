import { Column, Entity, Index } from "typeorm";

@Index("IX_FBPPRACTICA", ["codbole"], {})
@Index("PK_FBPPRACTICA", ["coduni"], { unique: true })
@Entity("FBPPRACTICA", { schema: "dbo" })
export class Fbppractica {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODBOLE" })
  codbole: number;

  @Column("int", { name: "CODANAL", nullable: true })
  codanal: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("money", { name: "BORRAR", nullable: true })
  borrar: number | null;
}

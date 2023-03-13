import { Column, Entity, Index } from "typeorm";

@Index("PK_CRVRENGL_1__23", ["coduni"], { unique: true })
@Entity("CRVRENGL", { schema: "dbo" })
export class Crvrengl {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODREC", nullable: true })
  codrec: number | null;

  @Column("int", { name: "TROQUEL", nullable: true })
  troquel: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 40 })
  descrip: string | null;

  @Column("int", { name: "CANPRE", nullable: true })
  canpre: number | null;

  @Column("int", { name: "CANENT", nullable: true })
  canent: number | null;

  @Column("int", { name: "COBERT", nullable: true })
  cobert: number | null;

  @Column("money", { name: "PREUNI", nullable: true })
  preuni: number | null;

  @Column("money", { name: "TOTAL", nullable: true })
  total: number | null;

  @Column("money", { name: "AC", nullable: true })
  ac: number | null;

  @Column("money", { name: "BENEF", nullable: true })
  benef: number | null;

  @Column("money", { name: "CPREUNI", nullable: true })
  cpreuni: number | null;

  @Column("money", { name: "CTOTAL", nullable: true })
  ctotal: number | null;

  @Column("money", { name: "CAC", nullable: true })
  cac: number | null;

  @Column("money", { name: "CBENEF", nullable: true })
  cbenef: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

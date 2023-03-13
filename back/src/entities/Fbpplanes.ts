import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPPLANES", ["codplan"], { unique: true })
@Entity("FBPPLANES", { schema: "dbo" })
export class Fbpplanes {
  @Column("int", { primary: true, name: "CODPLAN" })
  codplan: number;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("char", { name: "DESCRIPCION", nullable: true, length: 100 })
  descripcion: string | null;

  @Column("char", { name: "ABREV", nullable: true, length: 10 })
  abrev: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("float", { name: "PORCEN", nullable: true, precision: 53 })
  porcen: number | null;
}

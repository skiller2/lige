import { Column, Entity, Index } from "typeorm";

@Index("PK___5__13", ["codban"], { unique: true })
@Entity("MAEBANCOS", { schema: "dbo" })
export class Maebancos {
  @Column("int", { primary: true, name: "CODBAN" })
  codban: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "OTROS", nullable: true, length: 100 })
  otros: string | null;

  @Column("int", { name: "CALLE", nullable: true })
  calle: number | null;

  @Column("varchar", { name: "FAX", nullable: true, length: 100 })
  fax: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "NUMERO", nullable: true })
  numero: number | null;

  @Column("int", { name: "CODPOS", nullable: true })
  codpos: number | null;

  @Column("varchar", { name: "LOCALIDAD", nullable: true, length: 100 })
  localidad: string | null;

  @Column("varchar", { name: "TELEFONO", nullable: true, length: 100 })
  telefono: string | null;
}

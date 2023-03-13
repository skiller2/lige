import { Column, Entity, Index } from "typeorm";

@Index("USUAPRIKEY", ["nombre"], { unique: true })
@Entity("Usuarios", { schema: "dbo" })
export class Usuarios {
  @Column("varchar", { primary: true, name: "Nombre", length: 60 })
  nombre: string;

  @Column("smallint", { name: "Legajo", nullable: true })
  legajo: number | null;

  @Column("int", { name: "Oper", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "Stampa", nullable: true })
  stampa: Date | null;
}

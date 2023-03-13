import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPMEDICO_1__16", ["codmedi"], { unique: true })
@Entity("FBPMEDICO", { schema: "dbo" })
export class Fbpmedico {
  @Column("int", { primary: true, name: "CODMEDI" })
  codmedi: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "ESPEC", nullable: true, length: 100 })
  espec: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

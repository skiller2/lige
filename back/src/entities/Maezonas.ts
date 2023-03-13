import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEZONAS", ["mzoCod"], { unique: true })
@Entity("MAEZONAS", { schema: "dbo" })
export class Maezonas {
  @Column("int", { primary: true, name: "mzo_cod" })
  mzoCod: number;

  @Column("varchar", { name: "mzo_nombre", nullable: true, length: 255 })
  mzoNombre: string | null;

  @Column("int", { name: "oper", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "stampa", nullable: true })
  stampa: Date | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEBARRIOS", ["mbaCod"], { unique: true })
@Entity("MAEBARRIOS", { schema: "dbo" })
export class Maebarrios {
  @Column("int", { primary: true, name: "mba_cod" })
  mbaCod: number;

  @Column("varchar", { name: "mba_nombre", length: 255 })
  mbaNombre: string;

  @Column("int", { name: "mzo_cod", nullable: true })
  mzoCod: number | null;

  @Column("int", { name: "oper", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "stampa", nullable: true })
  stampa: Date | null;
}

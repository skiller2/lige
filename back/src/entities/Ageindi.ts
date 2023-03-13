import { Column, Entity, Index } from "typeorm";

@Index("CE", ["cod", "empcod"], { unique: true })
@Index("EC", ["empcod", "cod"], {})
@Index("PK___3__19", ["codreg"], { unique: true })
@Entity("AGEINDI", { schema: "dbo" })
export class Ageindi {
  @Column("int", { primary: true, name: "CODREG" })
  codreg: number;

  @Column("int", { name: "EMPCOD" })
  empcod: number;

  @Column("int", { name: "COD" })
  cod: number;
}

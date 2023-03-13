import { Column, Entity, Index } from "typeorm";

@Index("PK___5__22", ["codref"], { unique: true })
@Entity("CODREF", { schema: "dbo" })
export class Codref {
  @Column("int", { primary: true, name: "CODREF" })
  codref: number;

  @Column("varchar", { name: "DESCRIPCION", nullable: true, length: 255 })
  descripcion: string | null;
}

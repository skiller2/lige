import { Column, Entity, Index } from "typeorm";

@Index("PK___8__10", ["codooss", "codlis"], { unique: true })
@Entity("CUENLISTA", { schema: "dbo" })
export class Cuenlista {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("int", { primary: true, name: "CODLIS" })
  codlis: number;

  @Column("int", { name: "ORDEN", nullable: true })
  orden: number | null;
}

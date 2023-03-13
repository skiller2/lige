import { Column, Entity, Index } from "typeorm";

@Index("PK_CUENCOMI_1__10", ["coduni"], { unique: true })
@Entity("CUENCOMI", { schema: "dbo" })
export class Cuencomi {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODOOSS" })
  codooss: number;

  @Column("int", { name: "CODPLAN" })
  codplan: number;

  @Column("int", { name: "CODLIQ" })
  codliq: number;

  @Column("money", { name: "TOTCOMI", nullable: true })
  totcomi: number | null;

  @Column("money", { name: "RESCOMI", nullable: true })
  rescomi: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("money", { name: "TOTREIN", nullable: true })
  totrein: number | null;

  @Column("money", { name: "TOTCOMIX", nullable: true })
  totcomix: number | null;

  @Column("money", { name: "RESCOMIX", nullable: true })
  rescomix: number | null;
}

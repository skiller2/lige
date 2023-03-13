import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPNOMENC_1__16", ["codanal"], { unique: true })
@Entity("FBPNOMENC", { schema: "dbo" })
export class Fbpnomenc {
  @Column("int", { primary: true, name: "CODANAL" })
  codanal: number;

  @Column("varchar", { name: "CODNOM", nullable: true, length: 10 })
  codnom: string | null;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("money", { name: "IMPORTE1", nullable: true, default: () => "0" })
  importe1: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("money", { name: "IMPORTE2", nullable: true, default: () => "0" })
  importe2: number | null;

  @Column("int", { name: "URGENTE", nullable: true, default: () => "0" })
  urgente: number | null;

  @Column("int", { name: "PORCENT", nullable: true })
  porcent: number | null;

  @Column("int", { name: "MARCA1", nullable: true })
  marca1: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___2__24", ["id"], { unique: true })
@Entity("PELCUCOPE", { schema: "dbo" })
export class Pelcucope {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "NROFARPEL", nullable: true })
  nrofarpel: number | null;

  @Column("varchar", { name: "DESCRIPCION", nullable: true, length: 255 })
  descripcion: string | null;

  @Column("money", { name: "MONTO", nullable: true, default: () => "0" })
  monto: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("money", { name: "SALDO", nullable: true, default: () => "0" })
  saldo: number | null;

  @Column("tinyint", { name: "CTACTEFAR", nullable: true, default: () => "0" })
  ctactefar: number | null;
}

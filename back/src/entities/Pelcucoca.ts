import { Column, Entity, Index } from "typeorm";

@Index("PK_PELCUCOCA_1__22", ["id"], { unique: true })
@Entity("PELCUCOCA", { schema: "dbo" })
export class Pelcucoca {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "NROFARPEL", nullable: true })
  nrofarpel: number | null;

  @Column("smallint", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("smallint", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CANTIDAD", nullable: true, default: () => "0" })
  cantidad: number | null;

  @Column("varchar", { name: "DESCRIPCION", nullable: true, length: 255 })
  descripcion: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

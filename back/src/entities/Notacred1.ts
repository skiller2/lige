import { Column, Entity, Index } from "typeorm";

@Index("PK_NOTACRED1", ["id"], { unique: true })
@Entity("NOTACRED1", { schema: "dbo" })
export class Notacred1 {
  @Column("int", { primary: true, name: "ID" })
  id: number;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;
}

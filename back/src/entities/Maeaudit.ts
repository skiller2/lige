import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEAUDIT", ["mauCod"], { unique: true })
@Entity("MAEAUDIT", { schema: "dbo" })
export class Maeaudit {
  @Column("int", { primary: true, name: "MAU_COD" })
  mauCod: number;

  @Column("char", { name: "MAU_NOMBRE", nullable: true, length: 50 })
  mauNombre: string | null;

  @Column("datetime", { name: "MAU_STAMPA", nullable: true })
  mauStampa: Date | null;

  @Column("int", { name: "MAU_OPER", nullable: true })
  mauOper: number | null;
}

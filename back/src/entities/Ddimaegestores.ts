import { Column, Entity, Index } from "typeorm";

@Index("PK_DDIMAEGESTORES", ["dmgCod"], { unique: true })
@Entity("DDIMAEGESTORES", { schema: "dbo" })
export class Ddimaegestores {
  @Column("int", { primary: true, name: "dmg_cod" })
  dmgCod: number;

  @Column("nvarchar", { name: "dmg_descrip", nullable: true, length: 255 })
  dmgDescrip: string | null;

  @Column("int", { name: "dmg_flag", nullable: true })
  dmgFlag: number | null;

  @Column("int", { name: "dmg_oper", nullable: true })
  dmgOper: number | null;

  @Column("datetime", { name: "dmg_stampa", nullable: true })
  dmgStampa: Date | null;
}

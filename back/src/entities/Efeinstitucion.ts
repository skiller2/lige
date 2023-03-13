import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEINSTITUCION", ["einCod"], { unique: true })
@Entity("EFEINSTITUCION", { schema: "dbo" })
export class Efeinstitucion {
  @Column("int", { primary: true, name: "ein_cod" })
  einCod: number;

  @Column("varchar", { name: "ein_nombre", nullable: true, length: 255 })
  einNombre: string | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "ein_stampa", nullable: true })
  einStampa: Date | null;
}

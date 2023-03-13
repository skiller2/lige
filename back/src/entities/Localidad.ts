import { Column, Entity, Index } from "typeorm";

@Index("PK___2__19", ["codLoca"], { unique: true })
@Entity("LOCALIDAD", { schema: "dbo" })
export class Localidad {
  @Column("smallint", { primary: true, name: "COD_LOCA" })
  codLoca: number;

  @Column("varchar", { name: "LOCALIDAD", nullable: true, length: 255 })
  localidad: string | null;

  @Column("varchar", { name: "PROVINCIA", nullable: true, length: 255 })
  provincia: string | null;
}

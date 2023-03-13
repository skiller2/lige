import { Column, Entity, Index } from "typeorm";

@Index("PK_DIGIBASE", ["numeroRegistro"], { unique: true })
@Index("PorNroTroquel", ["numeroTroquel"], {})
@Entity("DIGIBASE", { schema: "dbo" })
export class Digibase {
  @Column("smallint", { primary: true, name: "NumeroRegistro" })
  numeroRegistro: number;

  @Column("varchar", { name: "NombreArticulo", nullable: true, length: 30 })
  nombreArticulo: string | null;

  @Column("varchar", {
    name: "PresentacionArticulo",
    nullable: true,
    length: 24,
  })
  presentacionArticulo: string | null;

  @Column("int", { name: "NumeroTroquel", nullable: true })
  numeroTroquel: number | null;

  @Column("float", { name: "PrecioSugerido", nullable: true, precision: 53 })
  precioSugerido: number | null;

  @Column("datetime", { name: "FechaPrecio", nullable: true })
  fechaPrecio: Date | null;

  @Column("smallint", { name: "Accion", nullable: true })
  accion: number | null;

  @Column("smallint", { name: "Laboratorio", nullable: true })
  laboratorio: number | null;

  @Column("smallint", { name: "Droga", nullable: true })
  droga: number | null;

  @Column("float", { name: "Pami", nullable: true, precision: 53 })
  pami: number | null;

  @Column("float", { name: "Ioma", nullable: true, precision: 53 })
  ioma: number | null;

  @Column("smallint", { name: "Marcas", nullable: true })
  marcas: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___1__24", ["nrofarpel"], { unique: true })
@Entity("PELFARM", { schema: "dbo" })
export class Pelfarm {
  @Column("int", { primary: true, name: "NROFARPEL" })
  nrofarpel: number;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 255 })
  nombre: string | null;

  @Column("varchar", { name: "DIRECCION", nullable: true, length: 255 })
  direccion: string | null;

  @Column("int", { name: "SALDOCAJAINI", nullable: true, default: () => "0" })
  saldocajaini: number | null;

  @Column("int", { name: "SALDOCAJAS", nullable: true, default: () => "0" })
  saldocajas: number | null;

  @Column("money", { name: "SALDOPESOS", nullable: true, default: () => "0" })
  saldopesos: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("char", {
    name: "DEBITA",
    nullable: true,
    length: 1,
    default: () => "'S'",
  })
  debita: string | null;
}

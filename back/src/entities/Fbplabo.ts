import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPLABO_1__16", ["codlabo"], { unique: true })
@Entity("FBPLABO", { schema: "dbo" })
export class Fbplabo {
  @Column("int", { primary: true, name: "CODLABO" })
  codlabo: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 100 })
  nombre: string | null;

  @Column("varchar", { name: "DIRECCION", nullable: true, length: 100 })
  direccion: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

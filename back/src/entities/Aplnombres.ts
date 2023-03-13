import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK_APLNOMBRES", ["coduni"], { unique: true })
@Entity("APLNOMBRES", { schema: "dbo" })
export class Aplnombres {
  @PrimaryGeneratedColumn({ type: "int", name: "CODUNI" })
  coduni: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 50 })
  nombre: string | null;

  @Column("varchar", { name: "EXENOMBRE", nullable: true, length: 50 })
  exenombre: string | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 255 })
  descrip: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

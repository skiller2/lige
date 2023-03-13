import { Column, Entity, Index } from "typeorm";

@Index("PK_MEDICOS", ["matricula"], { unique: true })
@Entity("MEDICOS", { schema: "dbo" })
export class Medicos {
  @Column("int", { primary: true, name: "MATRICULA" })
  matricula: number;

  @Column("char", { name: "TIPO", nullable: true, length: 1 })
  tipo: string | null;

  @Column("char", { name: "NOMBRE", nullable: true, length: 20 })
  nombre: string | null;

  @Column("char", { name: "ESPEC", nullable: true, length: 20 })
  espec: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("datetime", { name: "TIMESTP", nullable: true })
  timestp: Date | null;
}

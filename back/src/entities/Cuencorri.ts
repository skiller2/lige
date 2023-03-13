import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK___1__25", ["codoper"], { unique: true })
@Entity("CUENCORRI", { schema: "dbo" })
export class Cuencorri {
  @PrimaryGeneratedColumn({ type: "int", name: "CODOPER" })
  codoper: number;

  @Column("int", { name: "NROCUEN", nullable: true })
  nrocuen: number | null;

  @Column("int", { name: "NROFAR", nullable: true })
  nrofar: number | null;

  @Column("int", { name: "CODDES", nullable: true })
  coddes: number | null;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "CODPLAN", nullable: true })
  codplan: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("varchar", { name: "CLASE", nullable: true, length: 1 })
  clase: string | null;

  @Column("int", { name: "QUIOSEM", nullable: true })
  quiosem: number | null;
}

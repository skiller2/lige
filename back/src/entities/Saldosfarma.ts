import { Column, Entity, Index } from "typeorm";

@Index("PK_SALDOFARMA_3__10", ["coduni"], { unique: true })
@Index("PORNROFAR", ["nrofar"], {})
@Entity("SALDOSFARMA", { schema: "dbo" })
export class Saldosfarma {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "NROFAR" })
  nrofar: number;

  @Column("int", { name: "borrar", default: () => "0" })
  borrar: number;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "borrar3", nullable: true, default: () => "1" })
  borrar3: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "borrar1", nullable: true, default: () => "0" })
  borrar1: number | null;

  @Column("int", { name: "borrar2", nullable: true, default: () => "0" })
  borrar2: number | null;
}

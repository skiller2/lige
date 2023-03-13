import { Column, Entity, Index } from "typeorm";

@Index("PK___3__12", ["cod"], { unique: true })
@Entity("OSME_OBSER", { schema: "dbo" })
export class OsmeObser {
  @Column("int", { primary: true, name: "COD" })
  cod: number;

  @Column("int", { name: "CARA_5", nullable: true })
  cara_5: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "CODOBSER", nullable: true })
  codobser: number | null;

  @Column("int", { name: "NUM_TRO", nullable: true })
  numTro: number | null;

  @Column("int", { name: "NRO_RECE", nullable: true })
  nroRece: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "OPEREERR", nullable: true })
  opereerr: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK___2__13", ["codtra"], { unique: true })
@Entity("TRANSACBAN", { schema: "dbo" })
export class Transacban {
  @Column("int", { primary: true, name: "CODTRA" })
  codtra: number;

  @Column("int", { name: "CODBCOCU", nullable: true })
  codbcocu: number | null;

  @Column("char", { name: "CODCON", length: 4 })
  codcon: string;

  @Column("int", { name: "NROCHE", nullable: true })
  nroche: number | null;

  @Column("datetime", { name: "FECHA", nullable: true })
  fecha: Date | null;

  @Column("int", { name: "LIQUIDA", nullable: true })
  liquida: number | null;

  @Column("int", { name: "FARNRO", nullable: true })
  farnro: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "OPAGO", nullable: true })
  opago: number | null;

  @Column("int", { name: "MARCA", nullable: true, default: () => "0" })
  marca: number | null;

  @Column("int", { name: "OPER" })
  oper: number;

  @Column("datetime", { name: "STAMPA" })
  stampa: Date;

  @Column("int", { name: "CODREL", nullable: true, default: () => "0" })
  codrel: number | null;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("money", { name: "IMPREA", nullable: true, default: () => "0" })
  imprea: number | null;
}

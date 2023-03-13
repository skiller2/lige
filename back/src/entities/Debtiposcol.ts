import { Column, Entity, Index } from "typeorm";

@Index("PK___1__22COL", ["codeb"], { unique: true })
@Entity("DEBTIPOSCOL", { schema: "dbo" })
export class Debtiposcol {
  @Column("int", { primary: true, name: "CODEB" })
  codeb: number;

  @Column("varchar", { name: "DESCRI", nullable: true, length: 255 })
  descri: string | null;

  @Column("varchar", { name: "DESEXTRAC", nullable: true, length: 255 })
  desextrac: string | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "DIAREND", nullable: true, default: () => "0" })
  diarend: number | null;

  @Column("int", { name: "TIPOCAN", nullable: true, default: () => "0" })
  tipocan: number | null;

  @Column("int", { name: "CODMOVI", nullable: true, default: () => "0" })
  codmovi: number | null;

  @Column("int", { name: "MAXCUOT", nullable: true })
  maxcuot: number | null;

  @Column("money", { name: "MAXSALD", nullable: true, default: () => "0" })
  maxsald: number | null;

  @Column("int", { name: "RESTOCUOT", nullable: true })
  restocuot: number | null;

  @Column("int", { name: "COBFILDES", nullable: true, default: () => "0" })
  cobfildes: number | null;

  @Column("int", { name: "COBFILHAS", nullable: true, default: () => "0" })
  cobfilhas: number | null;

  @Column("money", { name: "COBFIMDES", nullable: true, default: () => "0" })
  cobfimdes: number | null;

  @Column("money", { name: "COBFIMHAS", nullable: true, default: () => "0" })
  cobfimhas: number | null;

  @Column("int", { name: "COBGENHAS", nullable: true, default: () => "0" })
  cobgenhas: number | null;

  @Column("money", { name: "COBGIMHAS", nullable: true, default: () => "0" })
  cobgimhas: number | null;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_RECIMOVCOB_2__10", ["codmov"], { unique: true })
@Entity("RECIMOVCOB", { schema: "dbo" })
export class Recimovcob {
  @Column("int", { primary: true, name: "CODMOV" })
  codmov: number;

  @Column("varchar", { name: "DESCRIREC", nullable: true, length: 50 })
  descrirec: string | null;

  @Column("varchar", { name: "DESCRIBUS", nullable: true, length: 10 })
  describus: string | null;

  @Column("int", { name: "TIPOCUE", nullable: true })
  tipocue: number | null;

  @Column("int", { name: "CODMOVTES", nullable: true })
  codmovtes: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "CODEB", nullable: true })
  codeb: number | null;

  @Column("int", { name: "GEFACO", nullable: true })
  gefaco: number | null;

  @Column("int", { name: "ESTADO", nullable: true })
  estado: number | null;

  @Column("varchar", { name: "CUENCONT", nullable: true, length: 255 })
  cuencont: string | null;
}

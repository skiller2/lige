import { Column, Entity, Index } from "typeorm";

@Index("PK___1__10", ["codcuota"], { unique: true })
@Entity("CUOTAS", { schema: "dbo" })
export class Cuotas {
  @Column("int", { primary: true, name: "CODCUOTA" })
  codcuota: number;

  @Column("datetime", { name: "FECVIGE" })
  fecvige: Date;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 50 })
  descrip: string | null;

  @Column("money", { name: "IMPORTE", nullable: true, default: () => "0" })
  importe: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("int", { name: "CODCATEG" })
  codcateg: number;

  @Column("int", { name: "TIPO", nullable: true, default: () => "0" })
  tipo: number | null;
}

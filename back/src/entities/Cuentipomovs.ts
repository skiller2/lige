import { Column, Entity, Index } from "typeorm";

@Index("PK_CUENTIPOMOVS_1__13", ["codmovi"], { unique: true })
@Entity("CUENTIPOMOVS", { schema: "dbo" })
export class Cuentipomovs {
  @Column("int", { primary: true, name: "CODMOVI" })
  codmovi: number;

  @Column("varchar", { name: "DESCRIP", nullable: true, length: 100 })
  descrip: string | null;

  @Column("int", { name: "SIGNO", nullable: true })
  signo: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", {
    name: "STAMPA",
    nullable: true,
    default: () => "getdate()",
  })
  stampa: Date | null;

  @Column("int", { name: "INCLISPA", nullable: true, default: () => "0" })
  inclispa: number | null;
}

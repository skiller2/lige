import { Column, Entity, Index } from "typeorm";

@Index(
  "PK___1__13",
  ["anio", "mes", "clase", "quiosem", "codooss", "codapli"],
  { unique: true }
)
@Entity("ImpreCarOSVAR", { schema: "dbo" })
export class ImpreCarOsvar {
  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("int", { primary: true, name: "ANIO" })
  anio: number;

  @Column("int", { primary: true, name: "MES" })
  mes: number;

  @Column("char", { primary: true, name: "CLASE", length: 1 })
  clase: string;

  @Column("int", { primary: true, name: "QUIOSEM" })
  quiosem: number;

  @Column("int", { primary: true, name: "CODAPLI" })
  codapli: number;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK_MAEPLANES", ["codooss", "codplan"], { unique: true })
@Index("UNI_CODPLAN", ["codplan"], { unique: true })
@Entity("MAEPLANES", { schema: "dbo" })
export class Maeplanes {
  @Column("int", { primary: true, name: "CODPLAN" })
  codplan: number;

  @Column("int", { primary: true, name: "CODOOSS" })
  codooss: number;

  @Column("varchar", { name: "NOMBRE", nullable: true, length: 40 })
  nombre: string | null;

  @Column("float", { name: "PORCEN", nullable: true, precision: 53 })
  porcen: number | null;

  @Column("float", { name: "BONIF", nullable: true, precision: 53 })
  bonif: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("int", { name: "TIPBONIF", nullable: true })
  tipbonif: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;

  @Column("float", {
    name: "PORCOLE",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  porcole: number | null;

  @Column("float", {
    name: "POREXTRA",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  porextra: number | null;
}

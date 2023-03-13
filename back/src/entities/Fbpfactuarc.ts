import { Column, Entity, Index } from "typeorm";

@Index("PK_FBPFACTUARC", ["coduni"], { unique: true })
@Entity("FBPFACTUARC", { schema: "dbo" })
export class Fbpfactuarc {
  @Column("int", { primary: true, name: "CODUNI" })
  coduni: number;

  @Column("int", { name: "CODPER", nullable: true })
  codper: number | null;

  @Column("int", { name: "ANIO", nullable: true })
  anio: number | null;

  @Column("int", { name: "MES", nullable: true })
  mes: number | null;

  @Column("int", { name: "QUINC", nullable: true })
  quinc: number | null;

  @Column("int", { name: "CODLABO", nullable: true })
  codlabo: number | null;

  @Column("int", { name: "CODOOSS", nullable: true })
  codooss: number | null;

  @Column("money", { name: "IMPORTE", nullable: true })
  importe: number | null;

  @Column("int", { name: "CANBOLE", nullable: true })
  canbole: number | null;

  @Column("int", { name: "OPER", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "STAMPA", nullable: true })
  stampa: Date | null;
}

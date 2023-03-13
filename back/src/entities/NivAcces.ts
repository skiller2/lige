import { Column, Entity, Index } from "typeorm";

@Index("PK__NivAcces", ["nroLeg", "aplicacion"], { unique: true })
@Entity("NivAcces", { schema: "dbo" })
export class NivAcces {
  @Column("int", { primary: true, name: "NroLeg" })
  nroLeg: number;

  @Column("char", { primary: true, name: "Aplicacion", length: 50 })
  aplicacion: string;

  @Column("int", { name: "Nivel", nullable: true })
  nivel: number | null;

  @Column("int", { name: "Oper", nullable: true })
  oper: number | null;

  @Column("datetime", { name: "Stampa", nullable: true })
  stampa: Date | null;
}

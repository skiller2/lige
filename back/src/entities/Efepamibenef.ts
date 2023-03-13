import { Column, Entity, Index } from "typeorm";

@Index("PK_EFEPAMIBENEF", ["ebeNben", "ebeGpar"], { unique: true })
@Entity("EFEPAMIBENEF", { schema: "dbo" })
export class Efepamibenef {
  @Column("varchar", { primary: true, name: "Ebe_Nben", length: 12 })
  ebeNben: string;

  @Column("varchar", { primary: true, name: "Ebe_Gpar", length: 2 })
  ebeGpar: string;

  @Column("varchar", { name: "Ebe_D_Ape_Nom", nullable: true, length: 50 })
  ebeDApeNom: string | null;

  @Column("varchar", { name: "Ebe_T_Docu", nullable: true, length: 50 })
  ebeTDocu: string | null;

  @Column("varchar", { name: "Ebe_Nro_Doc", nullable: true, length: 50 })
  ebeNroDoc: string | null;

  @Column("varchar", { name: "Ebe_N_CUIL", nullable: true, length: 50 })
  ebeNCuil: string | null;

  @Column("datetime", { name: "Ebe_F_Nacimiento", nullable: true })
  ebeFNacimiento: Date | null;

  @Column("varchar", { name: "Ebe_Sexo", nullable: true, length: 1 })
  ebeSexo: string | null;

  @Column("datetime", { name: "Ebe_FecAlta", nullable: true })
  ebeFecAlta: Date | null;

  @Column("datetime", { name: "Ebe_FecBaja", nullable: true })
  ebeFecBaja: Date | null;

  @Column("int", { name: "Ope_Oper", nullable: true })
  opeOper: number | null;

  @Column("datetime", { name: "Ebe_Stampa", nullable: true })
  ebeStampa: Date | null;
}

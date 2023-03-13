import { Column, Entity, Index } from "typeorm";

@Index("PK_MAELABO_1__16", ["mlaCod"], { unique: true })
@Entity("MAELABORATORIO", { schema: "dbo" })
export class Maelaboratorio {
  @Column("int", { primary: true, name: "mla_cod" })
  mlaCod: number;

  @Column("varchar", { name: "mla_nombre", nullable: true, length: 100 })
  mlaNombre: string | null;

  @Column("varchar", { name: "mla_domicilio", nullable: true, length: 100 })
  mlaDomicilio: string | null;

  @Column("varchar", { name: "mla_CUIT", nullable: true, length: 50 })
  mlaCuit: string | null;

  @Column("varchar", { name: "mla_nropami", nullable: true, length: 50 })
  mlaNropami: string | null;

  @Column("varchar", { name: "mla_nrougeo", nullable: true, length: 50 })
  mlaNrougeo: string | null;

  @Column("varchar", { name: "mla_nrobocate", nullable: true, length: 50 })
  mlaNrobocate: string | null;

  @Column("varchar", { name: "mla_profmatprov", nullable: true, length: 50 })
  mlaProfmatprov: string | null;

  @Column("varchar", { name: "mla_profmatnac", nullable: true, length: 50 })
  mlaProfmatnac: string | null;

  @Column("varchar", { name: "mla_profnropami", nullable: true, length: 50 })
  mlaProfnropami: string | null;

  @Column("varchar", { name: "mla_profbocate", nullable: true, length: 50 })
  mlaProfbocate: string | null;

  @Column("varchar", { name: "mla_proftipdoc", nullable: true, length: 50 })
  mlaProftipdoc: string | null;

  @Column("varchar", { name: "mla_profnrodoc", nullable: true, length: 50 })
  mlaProfnrodoc: string | null;

  @Column("varchar", { name: "mla_profcuit", nullable: true, length: 50 })
  mlaProfcuit: string | null;

  @Column("varchar", { name: "mla_profapel", nullable: true, length: 150 })
  mlaProfapel: string | null;

  @Column("varchar", { name: "mla_profnomb", nullable: true, length: 150 })
  mlaProfnomb: string | null;

  @Column("nchar", { name: "mla_profsexo", nullable: true, length: 1 })
  mlaProfsexo: string | null;

  @Column("datetime", { name: "mla_proffecnac", nullable: true })
  mlaProffecnac: Date | null;

  @Column("nchar", { name: "mla_profpres", nullable: true, length: 2 })
  mlaProfpres: string | null;

  @Column("nchar", { name: "mla_profespec", nullable: true, length: 4 })
  mlaProfespec: string | null;

  @Column("nchar", { name: "mla_profugl", nullable: true, length: 2 })
  mlaProfugl: string | null;

  @Column("nchar", { name: "mla_profugeo", nullable: true, length: 9 })
  mlaProfugeo: string | null;

  @Column("varchar", { name: "mla_profcalle", nullable: true, length: 50 })
  mlaProfcalle: string | null;

  @Column("varchar", { name: "mla_profnro", nullable: true, length: 50 })
  mlaProfnro: string | null;

  @Column("varchar", { name: "mla_profpiso", nullable: true, length: 50 })
  mlaProfpiso: string | null;

  @Column("varchar", { name: "mla_profdto", nullable: true, length: 50 })
  mlaProfdto: string | null;

  @Column("varchar", { name: "mla_profcodpos", nullable: true, length: 50 })
  mlaProfcodpos: string | null;

  @Column("varchar", { name: "mla_proflocalidad", nullable: true, length: 50 })
  mlaProflocalidad: string | null;

  @Column("varchar", { name: "mla_profpartido", nullable: true, length: 50 })
  mlaProfpartido: string | null;

  @Column("varchar", { name: "mla_profprovincia", nullable: true, length: 50 })
  mlaProfprovincia: string | null;

  @Column("varchar", { name: "mla_profddn", nullable: true, length: 50 })
  mlaProfddn: string | null;

  @Column("varchar", { name: "mla_proftelefono", nullable: true, length: 50 })
  mlaProftelefono: string | null;

  @Column("int", { name: "ope_Cod", nullable: true })
  opeCod: number | null;

  @Column("datetime", { name: "mla_STAMPA", nullable: true })
  mlaStampa: Date | null;

  @Column("varchar", { name: "mla_Localidad", nullable: true, length: 50 })
  mlaLocalidad: string | null;

  @Column("varchar", { name: "mla_Partido", nullable: true, length: 50 })
  mlaPartido: string | null;

  @Column("varchar", { name: "mla_Provincia", nullable: true, length: 50 })
  mlaProvincia: string | null;

  @Column("varchar", { name: "mla_Ugl", nullable: true, length: 2 })
  mlaUgl: string | null;
}

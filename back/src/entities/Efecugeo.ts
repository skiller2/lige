import { Column, Entity, Index } from "typeorm";

@Index("PK_EFECUGEO", ["ecuUbig"], { unique: true })
@Entity("EFECUGEO", { schema: "dbo" })
export class Efecugeo {
  @Column("nchar", { primary: true, name: "ecu_ubig", length: 9 })
  ecuUbig: string;

  @Column("nchar", { name: "ecu_desp", length: 20 })
  ecuDesp: string;

  @Column("nchar", { name: "ecu_desd", length: 30 })
  ecuDesd: string;

  @Column("nchar", { name: "ecu_desl", length: 40 })
  ecuDesl: string;

  @Column("nchar", { name: "ecu_dele", length: 2 })
  ecuDele: string;

  @Column("nchar", { name: "ecu_agen", length: 3 })
  ecuAgen: string;

  @Column("nchar", { name: "ecu_corr", length: 3 })
  ecuCorr: string;

  @Column("nchar", { name: "ecu_deta", length: 60 })
  ecuDeta: string;

  @Column("int", { name: "ope_Cod" })
  opeCod: number;

  @Column("datetime", { name: "ecu_stampa", default: () => "getdate()" })
  ecuStampa: Date;
}

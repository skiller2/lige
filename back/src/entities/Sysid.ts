import { Column, Entity, Index } from "typeorm";

@Index("PK_sysid_1__19", ["tableName"], { unique: true })
@Entity("sysid", { schema: "dbo" })
export class Sysid {
  @Column("varchar", { primary: true, name: "TableName", length: 60 })
  tableName: string;

  @Column("int", { name: "Id" })
  id: number;

  @Column("datetime", { name: "Last_Update", default: () => "getdate()" })
  lastUpdate: Date;

  @Column("varchar", { name: "Update_By", default: () => "'ANONIMO'" })
  updateBy: string;
}

import { Column, Entity, Index } from "typeorm";

@Index("PK__rb_table__76619304", ["tableName"], { unique: true })
@Index("table_name_idx", ["tableName"], { unique: true })
@Entity("rb_table", { schema: "dbo" })
export class RbTable {
  @Column("varchar", { primary: true, name: "table_name", length: 60 })
  tableName: string;

  @Column("varchar", { name: "table_alias", length: 60 })
  tableAlias: string;
}

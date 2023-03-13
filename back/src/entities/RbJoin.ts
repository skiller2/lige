import { Column, Entity, Index } from "typeorm";

@Index("PK__rb_join__756D6ECB", ["tableName1", "tableName2"], { unique: true })
@Index("rb_table1_table2_idx", ["tableName1", "tableName2"], { unique: true })
@Entity("rb_join", { schema: "dbo" })
export class RbJoin {
  @Column("varchar", { primary: true, name: "table_name1", length: 60 })
  tableName1: string;

  @Column("varchar", { primary: true, name: "table_name2", length: 60 })
  tableName2: string;

  @Column("varchar", { name: "join_type", length: 60 })
  joinType: string;

  @Column("varchar", { name: "field_names1", length: 255 })
  fieldNames1: string;

  @Column("varchar", { name: "operators", length: 60 })
  operators: string;

  @Column("varchar", { name: "field_names2", length: 255 })
  fieldNames2: string;
}

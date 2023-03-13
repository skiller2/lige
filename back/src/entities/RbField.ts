import { Column, Entity, Index } from "typeorm";

@Index("PK__rb_field__72910220", ["tableName", "fieldName"], { unique: true })
@Index("rb_table_field_alias_idx", ["tableName", "fieldAlias"], {
  unique: true,
})
@Index("rb_table_field_name_idx", ["tableName", "fieldName"], { unique: true })
@Entity("rb_field", { schema: "dbo" })
export class RbField {
  @Column("varchar", { primary: true, name: "table_name", length: 60 })
  tableName: string;

  @Column("varchar", { primary: true, name: "field_name", length: 60 })
  fieldName: string;

  @Column("varchar", { name: "field_alias", length: 60 })
  fieldAlias: string;

  @Column("varchar", { name: "datatype", length: 60 })
  datatype: string;

  @Column("char", { name: "selectable", length: 1 })
  selectable: string;

  @Column("char", { name: "searchable", length: 1 })
  searchable: string;

  @Column("char", { name: "sortable", length: 1 })
  sortable: string;

  @Column("char", { name: "autosearch", length: 1 })
  autosearch: string;

  @Column("char", { name: "mandatory", length: 1 })
  mandatory: string;
}

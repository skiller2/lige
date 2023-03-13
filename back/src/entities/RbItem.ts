import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index(
  "PK__rb_item__74794A92",
  ["folderId", "itemType", "itemName", "modified"],
  { unique: true }
)
@Entity("rb_item", { schema: "dbo" })
export class RbItem {
  @PrimaryGeneratedColumn({ type: "int", name: "item_id" })
  itemId: number;

  @Column("int", { primary: true, name: "folder_id" })
  folderId: number;

  @Column("varchar", { primary: true, name: "item_name", length: 60 })
  itemName: string;

  @Column("int", { name: "item_size" })
  itemSize: number;

  @Column("int", { primary: true, name: "item_type" })
  itemType: number;

  @Column("float", {
    primary: true,
    name: "modified",
    precision: 53,
    default: () => "0",
  })
  modified: number;

  @Column("float", {
    name: "deleted",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  deleted: number | null;

  @Column("image", { name: "template" })
  template: Buffer;

  @Column("int", { name: "app_id", default: () => "0" })
  appId: number;
}

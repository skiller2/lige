import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK__rb_folder__73852659", ["folderId"], { unique: true })
@Entity("rb_folder", { schema: "dbo" })
export class RbFolder {
  @PrimaryGeneratedColumn({ type: "int", name: "folder_id" })
  folderId: number;

  @Column("varchar", {
    name: "folder_name",
    length: 60,
    default: () => "'EMPTY'",
  })
  folderName: string;

  @Column("int", { name: "parent_id", default: () => "0" })
  parentId: number;

  @Column("int", { name: "app_id", nullable: true })
  appId: number | null;
}

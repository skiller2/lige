import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'colsFilter',standalone:true  })
export class ColsFilterPipe implements PipeTransform {
  transform(items: any[]): any {

    const cols= (items||[]).filter((col: any) => {
      return !col.hidden
    });
    return cols
  }
}

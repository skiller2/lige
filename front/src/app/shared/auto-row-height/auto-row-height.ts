import { AfterViewInit, Directive, inject, Input } from "@angular/core";
import { AngularGridInstance, AngularSlickgridComponent, SlickGrid } from "angular-slickgrid";

@Directive({
  selector: '[autoRowHeight]',
  standalone: true,
})
export class AutoRowHeightDirective implements AfterViewInit {

  //@Input({ required: true })
  //angularGrid!: AngularGridInstance;

  private slickgrid = inject(AngularSlickgridComponent);

  private cache = new Map<any, number>();

  private resizeObserver?: ResizeObserver;
  //  private canvas = document.createElement('canvas');

  //  private ctx = this.canvas.getContext('2d')!;


  private recalculateHeights(grid: SlickGrid) {
    this.cache.clear();

    grid.invalidateAllRows()
//    grid.invalidateRowHeights();
    grid.updateRowCount();
    grid.render();
  }

  ngAfterViewInit(): void {

    const grid = this.slickgrid.slickGrid;
//    grid.getOptions().rowHeightProvider =
//      (grid, _row, item) => this.getHeight(grid, item);

    grid.onColumnsResized.subscribe(() => {
      this.recalculateHeights(grid);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.recalculateHeights(grid);
    });

    this.resizeObserver.observe(
      grid.getContainerNode()
    );

    for (const column of grid.getColumns()) {
     if (!column.id || column.type != 'string') {
        continue;
      }
      grid.updateColumnById(column.id, { cssClass: `${column.cssClass ?? ''} cell-wrap`.trim() })
    }

    grid.updateColumns()


    const realCell = grid.getContainerNode()
      .querySelector('.slick-column-name') as HTMLElement;


    if (realCell) {
  
      const css = getComputedStyle(realCell);
  
      this.measure.style.font = css.font;
      this.measure.style.lineHeight = css.lineHeight;
      this.measure.style.padding = css.padding;
      this.measure.style.paddingTop = css.paddingTop;
      this.measure.style.paddingBottom = css.paddingBottom;
      this.measure.style.paddingLeft = css.paddingLeft;
      this.measure.style.paddingRight = css.paddingRight;

      this.measure.style.whiteSpace = css.whiteSpace;
      this.measure.style.wordBreak = css.wordBreak;
      this.measure.style.overflowWrap = css.overflowWrap;
      this.measure.style.letterSpacing = css.letterSpacing;
    }
//    this.measure.className="slick-cell cell-wrap"
    this.measure.style.wordBreak = 'break-word';
    this.measure.style.padding = '1px';

    document.body.appendChild(this.measure);

    grid.setOptions({enableVariableRowHeight: true, rowHeightProvider :
      (grid, _row, item) => this.getHeight(grid, item)})
  }

  ngOnDestroy() {
    document.body.removeChild(this.measure);
    this.resizeObserver?.disconnect();
  }

  private getHeight(grid: SlickGrid, item: any): number {
    const key = item.id ?? JSON.stringify(item);
    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    let height = 1;

    for (const column of grid.getColumns()) {

      if (column.hidden || column.type != 'string') {
        continue;
      }

      const header = grid
        .getContainerNode()
        .querySelector('.slick-header-column[id*=' + column.id + ']');

      const width = (header as HTMLElement)?.clientWidth ?? 200;

/*
    const realCell = grid.getContainerNode()
      .querySelector('.slick-cell') as HTMLElement;

    if (realCell) 
      console.log("en getHeight",realCell,getComputedStyle(realCell))
*/


      const text = String(item[column.id] ?? '');

      const heightTmp = this.measureLines(text, width, grid);

      height = Math.max(height, heightTmp);
    }

    this.cache.set(key, height);

    return height;
  }


  private measure = document.createElement('div');

  private measureLines(text: string, width: number, grid: SlickGrid): number {

    this.measure.style.width = `${width}px`;
    this.measure.textContent = text;
 
    const height = this.measure.offsetHeight;

    return Math.ceil(height);
  }

}
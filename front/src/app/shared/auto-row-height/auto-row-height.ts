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

    for (let i = 0; i < grid.getDataLength(); i++) {
      grid.invalidateRow(i);
    }

    grid.updateRowCount();
    grid.render();
  }

  ngAfterViewInit(): void {
    const grid = this.slickgrid.slickGrid;
    grid.getOptions().rowHeightProvider =
      (grid, _row, item) => this.getHeight(grid, item);

    grid.onColumnsResized.subscribe(() => {
      this.recalculateHeights(grid);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.recalculateHeights(grid);
    });

    this.resizeObserver.observe(
      grid.getContainerNode()
    );

    const columns = grid.getColumns().map(c => ({
      ...c,
      cssClass: c.type === 'string'
        ? `${c.cssClass ?? ''} cell-wrap`.trim()
        : c.cssClass
    }));

    grid.setColumns(columns);

    for (const column of grid.getColumns()) {

      if (!column.id || column.type != 'string') {
        continue;
      }


    }


  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private getHeight(grid: SlickGrid, item: any): number {
    console.log('getHeight', item)
    const key = item.id ?? JSON.stringify(item);

    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }



    /*
        const style = getComputedStyle(grid.getContainerNode());
    
        this.ctx.font = [
          style.fontStyle,
          style.fontWeight,
          style.fontSize,
          style.fontFamily,
        ].join(' ');
    
        const fontSize = parseFloat(style.fontSize);
    
        const lineHeight =
          style.lineHeight === 'normal'
            ? fontSize * 1.2
            : parseFloat(style.lineHeight);
    */

    let height = 1;

    for (const column of grid.getColumns()) {

      if (!column.id || column.type != 'string') {
        continue;
      }

      const header = grid
        .getContainerNode()
        .querySelector('.slick-header-column[id*=' + column.id + ']');

      const width = (header as HTMLElement)?.clientWidth ?? 200;


      const text = String(item[column.id] ?? '');

      const heightTmp = this.measureLines(
        text,
        width,//(column.width ?? 100) - 16
        grid
      );

      //maxLines = Math.max(maxLines, lines);
      height = Math.max(height, heightTmp);
    }

    this.cache.set(key, height);

    return height;
  }


  private measure = document.createElement('div');

  private measureLines(text: string, width: number, grid: SlickGrid): number {

    const realCell = grid.getContainerNode()
      .querySelector('.slick-cell') as HTMLElement;

    if (realCell) {
      const css = getComputedStyle(realCell);

      this.measure.style.font = css.font;
      this.measure.style.lineHeight = css.lineHeight;
      this.measure.style.padding = css.padding;
      this.measure.style.whiteSpace = css.whiteSpace;
      this.measure.style.wordBreak = css.wordBreak;
      this.measure.style.overflowWrap = css.overflowWrap;
      this.measure.style.letterSpacing = css.letterSpacing;

      width = width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);

    }

    this.measure.style.width = `${width}px`;
    this.measure.textContent = text;

    document.body.appendChild(this.measure);

    const height = this.measure.offsetHeight;

    document.body.removeChild(this.measure);

    return Math.ceil(height);
  }

}
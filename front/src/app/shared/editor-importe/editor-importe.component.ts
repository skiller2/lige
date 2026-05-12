import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-editor-importe',
  templateUrl: './editor-importe.component.html',
  imports: [...SHARED_IMPORTS]
})
export class EditorImporteComponent {
  @ViewChild('inp', { static: true }) inp!: ElementRef<HTMLInputElement>;

  display: string = '';
  selectedId: any = 0;
  private _selectedItem: any = 0;
  onItemChanged = new Subject<any>();
  collection?: any[];
  item: any;

  constructor(public element: ElementRef) { }

  get selectedItem() { return this._selectedItem; }
  set selectedItem(v: any) {
    this._selectedItem = (v === '' || v === null || v === undefined) ? 0 : Number(v);
    this.display = this.format(this._selectedItem);
  }

  private parse(v: string | number | null | undefined): number {
    if (v === '' || v === null || v === undefined) return 0;
    const clean = String(v).split('.').join('').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }

  private format(v: any): string {
    const num = Number(v);
    if (!isFinite(num)) return '';
    return num.toFixed(2).replace('.', ',');
  }

  onChange(v: string) {
    const num = this.parse(v);
    this._selectedItem = num;
    this.selectedId = num;
  }

  commit() {
    const num = this.parse(this.display);
    this._selectedItem = num;
    this.selectedId = num;
    this.onItemChanged.next(num);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.commit();
    }
  }

  focus() {
    setTimeout(() => {
      this.inp?.nativeElement.focus();
      this.inp?.nativeElement.select();
    });
  }

  ngAfterViewInit() {
    this.focus();
  }
}

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HotkeyDirective } from '@delon/abc/hotkey';
import { I18nPipe, Menu, MenuService } from '@delon/theme';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { BehaviorSubject, debounceTime, delay, distinctUntilChanged, tap } from 'rxjs';

@Component({
  selector: 'header-search',
  template: `
    <nz-input-wrapper>
      <nz-icon nzInputPrefix [nzType]="focus ? 'arrow-down' : 'search'" />
      @if (loading) {
        <nz-icon nzInputSuffix nzType="loading" />
      }
      <input
        type="text"
        nz-input
        [(ngModel)]="q"
        [nzAutocomplete]="auto"
        (input)="search($event)"
        (focus)="qFocus()"
        (blur)="qBlur()"
        hotkey="F1"
        [attr.placeholder]="'menu.search.placeholder' | i18n"
      />
    </nz-input-wrapper>
    <nz-autocomplete nzBackfill #auto>
      @for (i of options; track $index) {
        <nz-auto-option [nzValue]="i.text">
                    <div class="result-item" (click)="navigateToModule(i.link)">
                      <div class="result-title">{{ i.text }}</div>
                      <div class="result-path">{{ i.link }} </div>
                    </div>
        
        
        </nz-auto-option>
      }
    </nz-autocomplete>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, I18nPipe, NzInputModule, NzIconModule, NzAutocompleteModule, HotkeyDirective]
})
export class HeaderSearchComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly cdr = inject(ChangeDetectorRef);
  private menuService = inject(MenuService);
  private readonly router = inject(Router);

  q = '';
  qIpt: HTMLInputElement | null = null;
  options: Menu[] = [];
  search$ = new BehaviorSubject('');
  loading = false;

  @HostBinding('class.alain-default__search-focus')
  focus = false;
  @HostBinding('class.alain-default__search-toggled')
  searchToggled = false;
  menuItems = this.menuService.menus;
  @Input()
  set toggleChange(value: boolean) {
    if (typeof value === 'undefined') {
      return;
    }
    this.searchToggled = value;
    this.focus = value;
    if (value) {
      setTimeout(() => this.qIpt!.focus());
    }
  }
  @Output() readonly toggleChangeChange = new EventEmitter<boolean>();



  private searchInMenu(menuItems: Menu[], query: string): Menu[] {
    const results: Menu[] = [];

    for (const item of menuItems) {
      //const currentPath = parentPath ? `${parentPath} > ${item.text}` : item.text;
      
      // Buscar en el texto del item
      if (item.text && item.text.toLowerCase().includes(query)) {
        if (item.link) {
          results.push(item);
        }
      }

      // Buscar recursivamente en los hijos
      if (item.children && item.children.length > 0) {
        const childResults = this.searchInMenu(item.children, query);
        results.push(...childResults);
      }
    }

    return results;
  }

  ngAfterViewInit(): void {
    this.qIpt = this.el.querySelector('.ant-input') as HTMLInputElement;

    this.search$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.loading = true;
          this.cdr.detectChanges();
        }),
        //delay(500) // Mock http
      )
      .subscribe(value => {
        const valuetmp = value.trim().toLowerCase()
        if (valuetmp != '') {
          const results = this.searchInMenu(this.menuItems, valuetmp)
          this.options = results;
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  qFocus(): void {
    this.focus = true;
  }

  qBlur(): void {
    this.focus = false;
    this.searchToggled = false;
    this.options.length = 0;
    this.toggleChangeChange.emit(false);
  }

  search(ev: Event): void {
    this.search$.next((ev.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    this.search$.complete();
    this.search$.unsubscribe();
  }


  navigateToModule(link: string|undefined): void {
    if (link) {
      //this.closeSearch();
      // Navegar después de cerrar el modal
      setTimeout(() => {
        this.router.navigateByUrl(link);
      }, 200);
    }
  }

}
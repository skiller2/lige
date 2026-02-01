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


type SearchResult = {
  text: string;
  link?: string;
  /** crumbs incluyendo el propio label, e.g., ['Ventas', 'Reportes', 'Por Mes'] */
  path: string[];
  /** string preformateado para mostrar la ruta */
  pathLabel: string;
  /** clave estable para trackBy */
  trackBy: string;
  icon?: string;
};


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
  styles: [`
    .result-path {
      font-size: 0.8em;
      opacity: 0.7;
    }`],
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


  // Normaliza y saca diacríticos (ya tenías normalize, lo mantengo aquí para cohesión)
  normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Toma iniciales de palabras (p.ej., "Carga de Asistencia" -> "cda", "ca")
  private makeInitials(s: string): string {
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    // Iniciales de todas las palabras
    const all = parts.map(p => p[0]).join('');
    // Iniciales solo de palabras significativas (opcional: ignora preposiciones cortas)
    const significant = parts
      .filter(p => p.length > 2) // ignora "de", "la", etc. si miden <= 2
      .map(p => p[0])
      .join('');
    return `${all}|${significant}`;
  }

  // ¿token es subsecuencia de target? (ca ⊆ "carga")
  private isSubsequence(token: string, target: string): boolean {
    let ti = 0, si = 0;
    while (ti < token.length && si < target.length) {
      if (token.charCodeAt(ti) === target.charCodeAt(si)) ti++;
      si++;
    }
    return ti === token.length;
  }

  // ¿token coincide con comienzo de alguna palabra? (asi -> "asistencia")
  private matchesWordStart(token: string, target: string): boolean {
    // Busca límites de palabra y pruebalos
    const words = target.split(/\s+/);
    return words.some(w => w.startsWith(token));
  }

  private filterTree<T extends { children?: T[] }>(
    nodes: T[],
    predicate: (n: T) => boolean
  ): T[] {
    const out: T[] = [];
    for (const n of nodes) {
      const kids = n.children || [];
      const filteredKids = kids.length ? this.filterTree(kids, predicate) : [];
      if (predicate(n) || filteredKids.length > 0) {
        const clone = { ...n } as T;
        if (n.children || filteredKids.length) clone.children = filteredKids;
        out.push(clone);
      }
    }
    return out;
  }




  private matchesQuery(textRaw: string, queryRaw: string): boolean {
    const text = this.normalize(textRaw);
    const q = this.normalize(queryRaw);
    if (!q) return true;

    const tokens = q.split(' ').filter(Boolean);
    if (tokens.length === 0) return true;

    const initials = this.makeInitials(text); // ej: "cda|ca"
    const [allInit, sigInit] = initials.split('|');

    return tokens.every(tok => {
      // 1) Coincidencia directa dentro del texto
      if (text.includes(tok)) return true;

      // 2) Comienzo de alguna palabra
      if (this.matchesWordStart(tok, text)) return true;

      // 3) Subsecuencia del texto (ca ⊆ carga)
      if (this.isSubsequence(tok, text)) return true;

      // 4) Coincidencia con iniciales (ca ⊆ c a)
      if (allInit && (allInit.includes(tok) || this.isSubsequence(tok, allInit))) return true;
      if (sigInit && (sigInit.includes(tok) || this.isSubsequence(tok, sigInit))) return true;

      return false;
    });
  }


  nodeMatches(node: Menu, qNorm: string): boolean {
    if (!qNorm) return true;
    const fields = [
      node.text ?? '',
      node.i18n ?? '',
      node.link ?? '',
    ];
    return fields.some(f => this.matchesQuery(f, qNorm));
  }

  filterMenuByQuery(groups: Menu[], query: string): Menu[] {
    const qNorm = query; // ya no normalizamos aquí
    if (!this.normalize(qNorm)) {
      return groups.map(g => ({ ...g, children: g.children ? [...g.children] : [] }));
    }
    return this.filterTree(groups, (n) => this.nodeMatches(n, qNorm));
  }


  private toFlatResults(nodes: Menu[], parents: string[] = [], out: SearchResult[] = []): SearchResult[] {
    for (const n of nodes) {
      const label = n.text ?? n.i18n ?? '';
      const path = [...parents, label].filter(Boolean);

      if (n.link) {
        out.push({
          text: label,
          link: n.link,
          path,
          // Si prefieres no repetir el último (el propio item), usa path.slice(0, -1)
          pathLabel: path.join(' › '),
          trackBy: `${n.link}|${path.join('/')}`,
          icon: (n as any).icon
        });
      }

      if (n.children?.length) {
        this.toFlatResults(n.children, path, out);
      }
    }
    return out;
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
      .subscribe((value: string) => {
        if (value.trim().length >= 2) {
          const filteredTree = this.filterMenuByQuery(this.menuItems, value);
          this.options = this.toFlatResults(filteredTree);
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


  navigateToModule(link: string | undefined): void {
    if (link) {
      //this.closeSearch();
      // Navegar después de cerrar el modal
      setTimeout(() => {
        this.router.navigateByUrl(link);
        this.options = []
        this.qBlur();
      }, 200);
    }
  }

}
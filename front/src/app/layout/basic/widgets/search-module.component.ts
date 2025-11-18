import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map } from 'rxjs';

interface MenuItem {
  text: string;
  link?: string;
  children?: MenuItem[];
  [key: string]: any;
}

interface AppData {
  menu: MenuItem[];
  [key: string]: any;
}

interface SearchResult {
  text: string;
  link: string;
  path: string; 
}

@Component({
  selector: 'header-search-module',
  template: `
    <a layout-default-header-item-trigger style="cursor: pointer; display: flex; align-items: center; justify-content: center;" (click)="openSearch()">
      <i nz-icon nzType="search" nzTheme="outline" style="color: white;"></i>
    </a>
    
    @if (isModalVisible) {
      <div class="search-overlay" (click)="closeSearch()">
        <div class="search-modal" (click)="$event.stopPropagation()">
          <div class="search-header">
            <nz-input-group [nzPrefix]="iconTpl" [nzSize]="'large'">
              <ng-template #iconTpl>
                <i nz-icon nzType="search" style="color: #8c8c8c;"></i>
              </ng-template>
              <input
                type="text"
                nz-input
                [(ngModel)]="searchQuery"
                (input)="onSearch($event)"
                (keydown.escape)="closeSearch()"
                placeholder="Buscar módulos..."
                class="search-input-large"
                #searchInput
                autofocus
              />
            </nz-input-group>
            <button nz-button nzType="text" nzSize="large" (click)="closeSearch()" class="close-button">
              <i nz-icon nzType="close" nzTheme="outline"></i>
            </button>
          </div>
          @if (searchQuery.trim().length > 0) {
          <div class="search-content">
              @if (filteredResults.length > 0) {
                <div class="results-list">
                  @for (result of filteredResults; track result.link) {
                    <div class="result-item" (click)="navigateToModule(result.link)">
                      <div class="result-title">{{ result.text }}</div>
                      <div class="result-path">{{ result.path }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-results">
                  <i nz-icon nzType="file-search" style="font-size: 48px, color: #d9d9d9;"></i>
                  <p>No se encontraron módulos</p>
                </div>
              
            }
          </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`

 
    .search-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      animation: fadeIn 0.2s ease-in-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    .search-modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .search-header {
      padding: 24px;
      //border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .search-input-large {
      font-size: 18px;
      height: 56px;
      padding: 12px 16px;
    }
    
    .close-button {
      flex-shrink: 0;
    }
    
    .search-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      min-height: 300px;
      max-height: calc(80vh - 120px);
    }
    
    .results-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .result-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .result-item:hover {
      background-color: #f5f5f5;
      border-color: #1890ff;
      transform: translateX(4px);
    }
    
    .result-title {
      font-weight: 500;
      font-size: 16px;
      color: #262626;
      margin-bottom: 6px;
    }
    
    .result-path {
      font-size: 13px;
      color: #8c8c8c;
    }
    
    .no-results {
      padding: 60px 24px;
      text-align: center;
      color: #8c8c8c;
    }
    
    .no-results p {
      margin-top: 16px;
      font-size: 16px;
    }
    
    .empty-state {
      padding: 80px 24px;
      text-align: center;
      color: #8c8c8c;
    }
    
    .empty-state p {
      margin-top: 24px;
      font-size: 18px;
      color: #595959;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzAutocompleteModule,
    NzButtonModule
  ]
})
export class HeaderSearchModuleComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);

  searchQuery = '';
  allMenuItems: MenuItem[] = [];
  filteredResults: SearchResult[] = [];
  isModalVisible = false;
  private searchSubject = new BehaviorSubject<string>('');

  ngOnInit(): void {
    this.loadMenuData();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(query => query.trim().toLowerCase())
    ).subscribe(query => {
      if (query.length > 0) {
        this.filteredResults = this.searchInMenu(this.allMenuItems, query);
      } else {
        this.filteredResults = [];
      }
      this.cdr.detectChanges();
    });
  }

  private loadMenuData(): void {
    this.http.get<AppData>('./assets/app-data.json').subscribe({
      next: (data) => {
        this.allMenuItems = data.menu || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading app-data.json:', error);
      }
    });
  }

  private searchInMenu(menuItems: MenuItem[], query: string, parentPath: string = ''): SearchResult[] {
    const results: SearchResult[] = [];

    for (const item of menuItems) {
      const currentPath = parentPath ? `${parentPath} > ${item.text}` : item.text;
      
      // Buscar en el texto del item
      if (item.text && item.text.toLowerCase().includes(query)) {
        if (item.link) {
          results.push({
            text: item.text,
            link: item.link,
            path: currentPath
          });
        }
      }

      // Buscar recursivamente en los hijos
      if (item.children && item.children.length > 0) {
        const childResults = this.searchInMenu(item.children, query, currentPath);
        results.push(...childResults);
      }
    }

    return results;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  openSearch(): void {
    this.isModalVisible = true;
    // Prevenir scroll del body
    this.document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
    // Enfocar el input después de que el modal se renderice
    setTimeout(() => {
      const input = this.document.querySelector('.search-input-large') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  closeSearch(): void {
    this.isModalVisible = false;
    this.searchQuery = '';
    this.filteredResults = [];
    // Restaurar scroll del body
    this.document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Asegurar que el scroll se restaure si el componente se destruye con el modal abierto
    this.document.body.style.overflow = '';
  }

  navigateToModule(link: string): void {
    if (link) {
      this.closeSearch();
      // Navegar después de cerrar el modal
      setTimeout(() => {
        this.router.navigateByUrl(link);
      }, 200);
    }
  }
}


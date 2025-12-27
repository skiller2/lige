import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nPipe, SettingsService, User } from '@delon/theme';
import { LayoutDefaultModule, LayoutDefaultOptions } from '@delon/theme/layout-default';
import { SettingDrawerModule } from '@delon/theme/setting-drawer';
import { ThemeBtnComponent } from '@delon/theme/theme-btn';
import { environment } from '@env/environment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { HeaderClearStorageComponent } from './widgets/clear-storage.component';
import { HeaderFullScreenComponent } from './widgets/fullscreen.component';
import { HeaderI18nComponent } from './widgets/i18n.component';
import { HeaderIconComponent } from './widgets/icon.component';
import { HeaderNotifyComponent } from './widgets/notify.component';
import { HeaderRTLComponent } from './widgets/rtl.component';
import { HeaderSearchComponent } from './widgets/search.component';
import { HeaderTaskComponent } from './widgets/task.component';
import { HeaderUserComponent } from './widgets/user.component';
import { HeaderTitleComponent } from './widgets/title.component';
import { HeaderSearchModuleComponent } from './widgets/search-module.component';


@Component({
    selector: 'layout-basic',
    styleUrls: ['./basic.component.scss'],
    template: `
    <header-title class="alain-default__title"></header-title>

    <layout-default [options]="options" [content]="contentTpl" [customError]="null" >
      <layout-default-header-item direction="left"> 
        <header-search-module class="alain-search"></header-search-module>
      </layout-default-header-item>
      <layout-default-header-item direction="right" hidden="mobile"> 
        <a layout-default-header-item-trigger routerLink="/passport/lock">
          <i nz-icon nzType="lock"></i>
        </a>
      </layout-default-header-item>
      <!-- <layout-default-header-item direction="left" hidden="pc">
        <div layout-default-header-item-trigger (click)="searchToggleStatus = !searchToggleStatus">
          <i nz-icon nzType="search"></i>
        </div>
      </layout-default-header-item> -->

      
      <layout-default-header-item direction="middle" hidden="mobile">
      </layout-default-header-item> 


      <!-- <layout-default-header-item direction="right">
        <header-notify></header-notify>
      </layout-default-header-item> -->
      <!-- <layout-default-header-item direction="right" hidden="mobile">
        <header-task></header-task>
      </layout-default-header-item> -->
      <!-- <layout-default-header-item direction="right" hidden="mobile">
        <header-icon></header-icon>
      </layout-default-header-item> -->
      <layout-default-header-item direction="right" hidden="mobile">
        <div layout-default-header-item-trigger nz-dropdown [nzDropdownMenu]="settingsMenu" nzTrigger="click" nzPlacement="bottomRight">
          <i nz-icon nzType="setting"></i>
        </div>
        <nz-dropdown-menu #settingsMenu="nzDropdownMenu">
          <div nz-menu style="width: 200px;">
            <!-- div nz-menu-item>
              <header-rtl></header-rtl>
            </div -->
            <div nz-menu-item>
              <header-fullscreen></header-fullscreen>
            </div>
            <div nz-menu-item>
              <header-clear-storage></header-clear-storage>
            </div>
            <div nz-menu-item>
              <header-i18n></header-i18n>
            </div>
          </div>
        </nz-dropdown-menu>
      </layout-default-header-item>
      <layout-default-header-item direction="right">
        <header-user></header-user>
      </layout-default-header-item>

      <ng-template #asideUserTpl>
        <div nz-dropdown nzTrigger="click" [nzDropdownMenu]="userMenu" class="alain-default__aside-user">
          <nz-avatar class="alain-default__aside-user-avatar" [nzSrc]="user.avatar"></nz-avatar>
          <div class="alain-default__aside-user-info">
            <strong>{{ user.name }}</strong>
            <p class="mb0">{{ user.email }}</p>
          </div>
        </div>
        <nz-dropdown-menu #userMenu="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item routerLink="/pro/account/center">{{ 'menu.account.center' | i18n }}</li>
            <li nz-menu-item routerLink="/pro/account/settings">{{ 'menu.account.settings' | i18n }}</li>
          </ul>
        </nz-dropdown-menu>
      </ng-template>

      <ng-template #contentTpl>
        <router-outlet></router-outlet>
      </ng-template>

    </layout-default>
    <!-- <setting-drawer *ngIf="showSettingDrawer"></setting-drawer> -->
    <theme-btn></theme-btn>
  `,
    imports: [
        RouterOutlet,
        RouterLink,
        I18nPipe,
        LayoutDefaultModule,
        NzIconModule,
        NzMenuModule,
        NzDropDownModule,
        NzAvatarModule,
        SettingDrawerModule,
        ThemeBtnComponent,
        HeaderI18nComponent,
        HeaderClearStorageComponent,
        HeaderFullScreenComponent,
        HeaderUserComponent,
        HeaderTitleComponent,
        HeaderSearchModuleComponent
    ]
})
export class LayoutBasicComponent {
  private readonly settings = inject(SettingsService);
  options: LayoutDefaultOptions = {
    logoExpanded: `./assets/logo-lince-full.svg`,
    logoCollapsed: `./assets/logo-lince-simple.svg`
  };
  searchToggleStatus = false;
  showSettingDrawer = !environment.production;
  get user(): User {
    return this.settings.user;
  }
}
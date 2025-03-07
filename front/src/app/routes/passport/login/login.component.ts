import { CommonModule } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  Optional,
  inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StartupService } from '@core';
import { ReuseTabService } from '@delon/abc/reuse-tab';
import {
  ALLOW_ANONYMOUS,
  DA_SERVICE_TOKEN,
  ITokenModel,
  ITokenService,
  JWTTokenModel,
  SocialOpenType,
  SocialService,
} from '@delon/auth';
import { SettingsService, _HttpClient } from '@delon/theme';
import { environment } from '@env/environment';
import { SHARED_IMPORTS } from '@shared';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  BehaviorSubject,
  catchError,
  finalize,
  Observable,
  of,
  take,
} from 'rxjs';

@Component({
    selector: 'passport-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.less'],
    providers: [SocialService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...SHARED_IMPORTS, CommonModule]
})
export class UserLoginComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly socialService = inject(SocialService);
  private readonly reuseTabService = inject(ReuseTabService, { optional: true });
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly startupSrv = inject(StartupService);
  private readonly http = inject(_HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  // #region fields

  form = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.pattern(/^(.*)$/)]],
    password: ['', [Validators.required, Validators.pattern(/^(.*)$/)]],
    mobile: ['', [Validators.required, Validators.pattern(/^1\d{10}$/)]],
    captcha: ['', [Validators.required]],
    remember: [true],
  });
  error = '';
  type = 0;
  loading = false;

  passwordVisible$ = new BehaviorSubject(false);
  passwordType$ = new BehaviorSubject<'password' | 'text'>('password');
  // #region get captcha

  count = 0;
  interval$: any;

  // #endregion

  switch({ index }: NzTabChangeEvent): void {
    this.type = index!;
  }

  showLogin() {
    if (this.form.controls.password.value == '') return;
    this.passwordType$.next('text');
    this.passwordVisible$.next(true);
    setTimeout(() => {
      this.passwordType$.next('password');
      this.passwordVisible$.next(false);
    }, 2000);
  }

  getCaptcha(): void {
    const mobile = this.form.controls.mobile;
    if (mobile.invalid) {
      mobile.markAsDirty({ onlySelf: true });
      mobile.updateValueAndValidity({ onlySelf: true });
      return;
    }
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) {
        clearInterval(this.interval$);
      }
    }, 1000);
  }

  // #endregion

  submit(): void {
    this.error = '';
    if (this.type === 0) {
      const { userName, password } = this.form.controls;
      userName.markAsDirty();
      userName.updateValueAndValidity();
      password.markAsDirty();
      password.updateValueAndValidity();
      if (userName.invalid || password.invalid) {
        return;
      }
    } else {
      const { mobile, captcha } = this.form.controls;
      mobile.markAsDirty();
      mobile.updateValueAndValidity();
      captcha.markAsDirty();
      captcha.updateValueAndValidity();
      if (mobile.invalid || captcha.invalid) {
        return;
      }
    }

    // 默认配置中对所有HTTP请求都会强制 [校验](https://ng-alain.com/auth/getting-started) 用户 Token
    // 然一般来说登录请求不需要校验，因此加上 `ALLOW_ANONYMOUS` 表示不触发用户 Token 校验
    this.loading = true;
    this.cdr.detectChanges();
    this.http
    .post(
//      '/login/account',
      '/api/auth/login',
      {
        type: this.type,
        userName: this.form.value.userName,
        password: this.form.value.password
      },
      null,
      {
        context: new HttpContext().set(ALLOW_ANONYMOUS, true)
      }
    )
    .pipe(
        take(1),
        catchError(err => {
          console.log('error',err)
          this.error = err.error?.msg;
          return of();
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(res => {
        // 清空路由复用信息
        this.reuseTabService?.clear();
        // 设置用户Token信息
        // TODO: Mock expired value
        //res.user.expired = +new Date() + 1000 * 60 * 5;
        //this.tokenService.set(res.user);


        const tokenTmp: ITokenModel = {
          expired: 0,
          token: res.data.token,
        };
        this.tokenService.set(tokenTmp);
        const tkndec: any = this.tokenService.get(JWTTokenModel);

        const token: ITokenModel = {
          expired: tkndec.exp,
          token: res.data.token,
        };
        this.tokenService.set(token);

        // 重新获取 StartupService 内容，我们始终认为应用信息一般都会受当前用户授权范围而影响

        this.startupSrv.load().subscribe((_res: any) => {
          let url = this.tokenService.referrer!.url || '/';
          if (url.includes('/passport')) {
            url = '/';
          }
          console.log('this.router.navigateByUrl',url)
          this.router.navigateByUrl(url).catch();
        });
      });
  }

  // #region social

  open(type: string, openType: SocialOpenType = 'href'): void {
    let url = ``;
    let callback = ``;
    if (environment.production) {
      callback = `https://ng-alain.github.io/ng-alain/#/passport/callback/${type}`;
    } else {
      callback = `http://localhost:4200/#/passport/callback/${type}`;
    }
    switch (type) {
      case 'auth0':
        url = `//cipchk.auth0.com/login?client=8gcNydIDzGBYxzqV0Vm1CX_RXH-wsWo5&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
      case 'github':
        url = `//github.com/login/oauth/authorize?client_id=9d6baae4b04a23fcafa2&response_type=code&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
      case 'weibo':
        url = `https://api.weibo.com/oauth2/authorize?client_id=1239507802&response_type=code&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
    }
    if (openType === 'window') {
      this.socialService
        .login(url, '/', {
          type: 'window',
        })
        .subscribe(res => {
          if (res) {
            this.settingsService.setUser(res);
            this.router.navigateByUrl('/');
          }
        });
    } else {
      this.socialService.login(url, '/', {
        type: 'href',
      });
    }
  }

  // #endregion

  ngOnDestroy(): void {
    if (this.interval$) {
      clearInterval(this.interval$);
    }
  }
}

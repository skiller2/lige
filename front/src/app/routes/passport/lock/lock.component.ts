import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StartupService } from '@core';
import { DA_SERVICE_TOKEN, ITokenModel, ITokenService, JWTTokenModel } from '@delon/auth';
import { SettingsService, User, _HttpClient } from '@delon/theme';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'passport-lock',
  templateUrl: './lock.component.html',
  styleUrls: ['./lock.component.less']
})
export class UserLockComponent {
  f: FormGroup;

  get user(): User {
    return this.settings.user;
  }

  constructor(
    fb: FormBuilder,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
    private http: _HttpClient,
    private settings: SettingsService,
    private startupSrv: StartupService,

    private router: Router
  ) {
    this.f = fb.group({
      password: [null, Validators.required]
    });
  }

  submit(): void {
    for (const i in this.f.controls) {
      this.f.controls[i].markAsDirty();
      this.f.controls[i].updateValueAndValidity();
    }
    if (this.f.valid) {
      this.http
        .post('api/auth/login', {
          type: 0,
          username: this.user.key,
          password: this.f.value.password
        })
        .pipe(
          finalize(() => {
            //            this.loading = false;
            //            this.cdr.detectChanges();
          })
        )
        .subscribe(
          res => {
            if (res.msg !== 'ok') {
              return;
            }

            const tokenTmp: ITokenModel = {
              expired: 0,
              token: res.data.token
            };
            this.tokenService.set(tokenTmp);
            const tkndec: any = this.tokenService.get(JWTTokenModel);

            const token: ITokenModel = {
              expired: tkndec.exp,
              token: res.data.token
            };
            this.tokenService.set(token);

            //Levanto la config inicial
            this.startupSrv.load().subscribe(() => {
              let url = this.tokenService.referrer!.url || '/';
              if (url.includes('/passport')) {
                url = '/';
              }
              this.router.navigateByUrl(url);
              //            this.router.navigate(['dashboard']);
            });
          },
          error => {}
        );
      /*
      console.log('Valid!');
      console.log(this.f.value);
      this.tokenService.set({
        token: '123'
      });
      this.router.navigate(['dashboard']);
*/
    }
  }
}

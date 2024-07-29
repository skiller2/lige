import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));






/*
import "@angular/compiler"
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));  
*/
/* 


import { environment } from './environments/environment';



if (environment.production) {
  enableProdMode();
}

    defaultEncapsulation: ViewEncapsulation.Emulated,
    preserveWhitespaces: false,
  */


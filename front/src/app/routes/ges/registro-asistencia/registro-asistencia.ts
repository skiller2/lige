import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-registro-asistencia',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './registro-asistencia.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroAsistenciaComponent {

  public router = inject(Router)

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );


  ngOnInit(): void {
    if (this.currentUrl()!='ges/registro-asistencia/carga')
      this.router.navigateByUrl('ges/registro-asistencia/carga')
  }

}

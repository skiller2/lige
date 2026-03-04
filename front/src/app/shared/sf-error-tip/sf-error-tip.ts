import {
  Directive,
  InjectionToken,
  ChangeDetectorRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { NzFormControlComponent } from 'ng-zorro-antd/form';
import type { ValidationError } from '@angular/forms/signals';

export type SfErrorMap = Record<
  string,
  string | ((e: ValidationError) => string)
>;

export const SF_ERROR_MAP = new InjectionToken<SfErrorMap>('SF_ERROR_MAP');
export const SF_SHOW_ON = new InjectionToken<'touched' | 'dirty' | 'always'>(
  'SF_SHOW_ON'
);

export const SF_AGGREGATE_MODE = new InjectionToken<'first' | 'all'>(
  'SF_AGGREGATE_MODE'
);


@Directive({
  selector: '[sfErrorTip]',
  standalone: true,
})
export class SfErrorTipDirective {
  // 🔴 IMPORTANTE: alias para que [sfErrorTip]="..." alimente este input
  readonly field = input.required<any>({ alias: 'sfErrorTip' });

  private readonly injectedErrorMap =
    inject(SF_ERROR_MAP, { optional: true }) ?? undefined;
  readonly errorMap = input<SfErrorMap | undefined>(this.injectedErrorMap);

  private readonly injectedShowOn =
    inject(SF_SHOW_ON, { optional: true }) ?? 'touched';
  readonly showOn = input<'touched' | 'dirty' | 'always'>(this.injectedShowOn);


  // Nuevo: modo de agregación (first | all)
  private readonly injectedAggregate =
    inject(SF_AGGREGATE_MODE, { optional: true }) ?? 'all';
  readonly aggregate = input<'first' | 'all'>(this.injectedAggregate);



  private readonly nzFormControl = inject(NzFormControlComponent, {
    optional: true,
  });
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const host = this.nzFormControl;
      const fieldRef = this.field();

      if (!host || !fieldRef) return;

      const state = fieldRef();

      const mode = this.showOn();
      const shouldShow =
        mode === 'always' ||
        (mode === 'touched' && state.touched()) ||
        (mode === 'dirty' && state.dirty());

      const errs: readonly ValidationError[] =
        state.invalid() ? state.errors() ?? [] : [];

      let message: string | undefined = undefined;


      if (shouldShow && errs.length) {
        const map = this.errorMap();
        const toText = (e: ValidationError): string => {
          if (e.message) return e.message;
          if (map) {
            const entry = map[e.kind];
            if (typeof entry === 'function') return entry(e);
            if (typeof entry === 'string') return entry;
          }
          return e.kind; // fallback
        };

        if (this.aggregate() === 'all') {
          // Uní todos los mensajes con saltos de línea
          message = errs.map(toText).join('\n');
        } else {
          // Solo el primero (comportamiento anterior)
          message = toText(errs[0]);
        }
      }


      host.nzValidateStatus = shouldShow && errs.length ? 'error' : '';
      // nzErrorTip: string | TemplateRef | undefined (nunca null)
      host.nzErrorTip = message ?? undefined;

      // Forzamos chequeo (OnPush)
      this.cdr.markForCheck();
    });
  }
}
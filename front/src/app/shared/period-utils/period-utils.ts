import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export type PeriodUnit = 'D' | 'S' | 'M' | 'A';

export interface Period {
  value: number;
  unit: PeriodUnit;
}

export const PERIOD_REGEX = /^(?<value>\d+)\s*(?<unit>[DSMA])$/i;

/** Parsea un string tipo "2A", "3S", "1M", "15D" a objeto Period */
export function parsePeriod_old(input: string | null | undefined): Period | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  const match = PERIOD_REGEX.exec(trimmed);
  if (!match || !match.groups) return null;

  const value = Number(match.groups['value']);
  const unit = match.groups['unit'].toUpperCase() as PeriodUnit;

  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, unit };
}

export function parsePeriod(v: string | null ): Period {
  const s = (v ?? '').trim().toUpperCase();
  const m = /^([0-9]+)\s*([DSMA])$/.exec(s);
  if (!m) return { value: 0, unit:'D'} ;
  return { value: Number(m[1]), unit: m[2] as PeriodUnit };
}



/** Normaliza a ISO 8601 (P{n}D | P{n}W | P{n}M | P{n}Y) */
export function toIsoDuration(p: Period): string {
  switch (p.unit) {
    case 'D': return `P${p.value}D`;
    case 'S': return `P${p.value}W`;
    case 'M': return `P${p.value}M`;
    case 'A': return `P${p.value}Y`;
  }
}

/** Conversión aproximada a días para comparar rangos */
export function toApproxDays(p: Period): number {
  switch (p.unit) {
    case 'D': return p.value;
    case 'S': return p.value * 7;
    case 'M': return p.value * 30;
    case 'A': return p.value * 365;
  }
}


/** Construye Period desde string corto (e.g., '2A') */
export function fromShortString(s: string): Period | null {
  return parsePeriod(s);
}

/** Compara dos períodos por aproximación a días */
export function comparePeriodsApprox(a: Period, b: Period): number {
  const da = toApproxDays(a);
  const db = toApproxDays(b);
  return da === db ? 0 : da < db ? -1 : 1;
}



export interface PeriodValidatorOptions {
  /** Límite inferior permitido (string corto, ej. '1D', '1M') */
  min?: string;
  /** Límite superior permitido (string corto, ej. '2A') */
  max?: string;
  /** Unidades permitidas (por defecto todas: D, S, M, A) */
  allowedUnits?: PeriodUnit[];
}

export function periodValidator(opts: PeriodValidatorOptions = {}): ValidatorFn {
  const allowed: PeriodUnit[] = opts.allowedUnits ?? ['D', 'S', 'M', 'A'];
  const minP: Period | null = opts.min ? fromShortString(opts.min) : null;
  const maxP: Period | null = opts.max ? fromShortString(opts.max) : null;

  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value as string;
    const parsed = parsePeriod(raw);

    if (!parsed) {
      return { periodInvalid: true, reason: 'Formato inválido. Usa p.ej. 1M, 2A, 3S, 10D.' };
    }

    if (!allowed.includes(parsed.unit)) {
      return { periodUnitNotAllowed: { unit: parsed.unit, allowed } };
    }

    if (minP && comparePeriodsApprox(parsed, minP) < 0) {
      return { periodTooSmall: { min: opts.min } };
    }

    if (maxP && comparePeriodsApprox(parsed, maxP) > 0) {
      return { periodTooLarge: { max: opts.max } };
    }

    return null;
  };
}


export function periodToText(p: Period): string {
  const { value, unit } = p;

  const map: Record<PeriodUnit, { singular: string; plural: string }> = {
    A: { singular: 'Año', plural: 'Años' },
    M: { singular: 'Mes', plural: 'Meses' },
    S: { singular: 'Semana', plural: 'Semanas' },
    D: { singular: 'Día', plural: 'Días' }
  };

  const labels = map[unit];
  if (!labels) return `${value} ${unit}`; // fallback improbable

  const word = value === 1 ? labels.singular : labels.plural;
  return `${value} ${word}`;
}

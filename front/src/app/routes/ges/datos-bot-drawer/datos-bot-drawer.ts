import { Component, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';

export interface FormDataBot {
  id: number;
  Telefono: string;
  periodoRecibo: string;
}

@Component({
  selector: 'app-datos-bot-drawer',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './datos-bot-drawer.html',
  styleUrl: './datos-bot-drawer.scss',
})
export class DatosBotDrawerComponent {

  visible = input<boolean>(false);
  personalId = input<number>(0);
  onClose = output<boolean>();
  onAddorUpdate = output();

  isVisible = linkedSignal(() => this.visible());
  PersonalNombre = signal<string>('');

  private searchService = inject(SearchService);

  private datosBotDefault: FormDataBot = {
    id: 0,
    Telefono: '',
    periodoRecibo: '',
  }

  readonly datosBot = signal<FormDataBot>(this.datosBotDefault);
  readonly ultimoNroRecibo = signal<any>(null);
  readonly loadingNroRecibo = signal<boolean>(false);

  loadEffect = effect(async () => {
    if (!this.isVisible()) {
      this.ultimoNroRecibo.set(null);
      return;
    }

    if (this.personalId()) {
      const personal = await firstValueFrom(this.searchService.getPersonalById(this.personalId()))
      this.PersonalNombre.set(personal.PersonalApellido + ', ' + personal.PersonalNombre)

      let infoBot = await firstValueFrom(this.searchService.getDatosBotByPersonalId(this.personalId()))
      this.datosBot.update(m => ({
        ...m,
        ...infoBot,
      }));
    }
  })

  async verUltimoRecibo(): Promise<void> {
    if (!this.personalId()) return;
    this.loadingNroRecibo.set(true);
    try {
      const data = await firstValueFrom(this.searchService.getUltimoNroReciboByPersonalId(this.personalId()));
      this.ultimoNroRecibo.set(data);
    } finally {
      this.loadingNroRecibo.set(false);
    }
  }

  closeDrawer(): void {
    this.isVisible.set(false)
    this.onClose.emit(this.isVisible())
  }

}

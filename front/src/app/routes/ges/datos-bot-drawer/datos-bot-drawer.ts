import { Component, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { disabled, form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

export interface FormDataBot {
  id: number;
  Telefono: string;
  periodoRecibo: string;
}

@Component({
  selector: 'app-datos-bot-drawer',
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, FormField],
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
  private apiService = inject(ApiService);

  private datosBotDefault: FormDataBot = {
    id: 0,
    Telefono: '',
    periodoRecibo: '',
  }

  readonly datosBot = signal<FormDataBot>(this.datosBotDefault);

  readonly formDatosBot = form(this.datosBot, (p) => {
    required(p.Telefono, { message: 'El teléfono es obligatorio' });
    required(p.periodoRecibo, { message: 'El período es obligatorio' });
    disabled(p.Telefono ,() => true);
    disabled(p.periodoRecibo, () => true);
  })

  loadEffect = effect(async () => {
    if (!this.isVisible()) return
    
    if (this.personalId()) {
      const personal = await firstValueFrom(this.searchService.getPersonalById(this.personalId()))
      this.PersonalNombre.set(personal.PersonalApellido + ', ' + personal.PersonalNombre)

      let infoBot = await firstValueFrom(this.searchService.getDatosBotByPersonalId(this.personalId()))
      this.datosBot.update(m => ({
        ...m,
        ...infoBot,
      }));
      setTimeout(() => { this.formDatosBot().reset() }, 400);
    }
  })

  closeDrawer(): void {
    this.isVisible.set(false)
    this.onClose.emit(this.isVisible())
  }

}

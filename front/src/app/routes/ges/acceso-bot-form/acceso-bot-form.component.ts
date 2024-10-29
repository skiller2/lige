import { Component, model, signal } from '@angular/core';

@Component({
  selector: 'app-acceso-bot-form',
  standalone: true,
  imports: [],
  templateUrl: './acceso-bot-form.component.html',
  styleUrl: './acceso-bot-form.component.less'
})
export class AccesoBotFormComponent {

  edit = model(true)
  isLoading = signal(false)
  addNew = model()

}


import { CommonModule } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../app/services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';

import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-mess',
  imports: [NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    NzUploadModule,
    PersonalSearchComponent,
    MarkdownModule
  ],
  templateUrl: './mess.component.html',
  styleUrl: './mess.component.scss'
})
export class MessComponent {
  messInfo = signal({ 'msg': 'descansando' })
  ultimoDeposito = signal({ 'msg': 'descansando' })
  imagenUrl = signal('')
  ms = signal(0)
  mensaje = model('')
  destino = model('')

  showTools = signal<boolean>(false);


  toggleShowTools(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.showTools.set(!!input.checked);
  }


  private apiService = inject(ApiService)
  async getMessInfo() {
    try {
      this.messInfo.set(await firstValueFrom(this.apiService.getMessInfo()))
    } catch (e) {
      console.log(e)
      this.messInfo.set({ 'msg': 'error' })
    }
  }

  msChange(result: number): void {
    this.ms.set(result)
  }

  async setMs() {
    try {
      await firstValueFrom(this.apiService.setChatBotDelay(this.ms()))
    } catch (e) {
      console.log(e)
      this.ultimoDeposito.set({ 'msg': 'error' })
    }
  }

  async enviaMensaje() {
    await firstValueFrom(this.apiService.sendMessage(this.destino(), this.mensaje()))

  }

  usermsg = signal('')
  chatId = signal('');
  msgs = signal<any[]>([])
  async enviaChat($event: any) {

    const btn = $event.currentTarget as HTMLButtonElement;

    btn.disabled = true;

    localStorage.setItem('chatId', this.chatId())


    try {
      const resp: any = await firstValueFrom(this.apiService.sendChatMessage(this.usermsg(), this.chatId()))

      const newMsg: any[] = resp.response

      this.msgs.update(list => [...list, ...resp.response]);

      this.usermsg.set('')
    } catch { }
    btn.disabled = false

  }

  async reiniciaChat() {
    const resp = await firstValueFrom(this.apiService.reiniciaChat(this.chatId()))
    this.msgs.set([])
  }



  async ngOnInit() {
    const chatId = localStorage.getItem('chatId')
    if (chatId) {
      this.chatId.set(chatId)
    }

    try {
      this.ms.set(await firstValueFrom(this.apiService.getChatBotDelay()))
      let imagenCount = 0
      this.getMessInfo()
      //setInterval(() => { this.imagenUrl.set(`./mess/api/chatbot/qr/${imagenCount++}`) }, 3000)
    } catch (error) {
      console.log(error)
    }


    const resIAPrompt: any = await firstValueFrom(this.apiService.getIaPrompt())

    this.iaPrompt.set(resIAPrompt.data.iaPrompt)

    const resIATools: any = await firstValueFrom(this.apiService.getIaTools())
    this.iaTools.set(resIATools.data.iaTools)

  }

  trackByMsgId(index: number, msg: any): any {
    return msg.id ?? index;
  }

  async changePersona(PersonalId: number) {
    if (!PersonalId) return
    const res = await firstValueFrom(this.apiService.getAccesoBot(PersonalId))

    if (res?.Telefono) {
      this.chatId.set(res.Telefono)
      localStorage.setItem('chatId', this.chatId())
    } else {
      this.chatId.set('')
    }

  }

  iaPrompt = signal('')
  iaTools = signal('')
  async setIaPrompt($event: any) {
    const btn = $event.currentTarget as HTMLButtonElement;
    btn.disabled = true;

    try {
      const resp: any = await firstValueFrom(this.apiService.setIaPrompt(this.iaPrompt()))
      this.iaPrompt.set(resp.data.iaPrompt)
    } catch { }
    btn.disabled = false

  }

  async setIaTools($event: any) {
    const btn = $event.currentTarget as HTMLButtonElement;
    btn.disabled = true;

    try {
      const resp: any = await firstValueFrom(this.apiService.setIaTools(this.iaTools()))
      this.iaTools.set(resp.data.iaTools)
    } catch { }
    btn.disabled = false

  }


  toJsonString(value: unknown, pretty: boolean): string {
    if (typeof value === 'string') {
      // Si ya viene como string, lo usamos tal cual (no asumimos que sea JSON válido)
      try {
        // Si es JSON válido y queremos pretty, reindentamos
        const parsed = JSON.parse(value);
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      } catch {
        // No es JSON válido: devolvemos el string crudo
        return value;
      }
    } else {
      // Objeto/array: serializamos
      return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
    }
  }


}

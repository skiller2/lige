import { CommonModule } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { RowDetailViewComponent } from 'src/app/shared/row-detail-view/row-detail-view.component';
import { RowPreloadDetailComponent } from 'src/app/shared/row-preload-detail/row-preload-detail.component';

@Component({
  selector: 'app-mess',
  imports: [NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    NzUploadModule
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
  async enviaChat() {
    localStorage.setItem('chatId', this.chatId())
    const resp: any = await firstValueFrom(this.apiService.sendChatMessage(this.usermsg(), this.chatId()))
    console.log('resp', resp.response)
    this.msgs.set([...this.msgs(), resp.response])
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
  }
}

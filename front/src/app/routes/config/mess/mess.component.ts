import { CommonModule } from '@angular/common';
import { Component, inject, input, model, signal } from '@angular/core';
import { applyEach, form, FormField, minLength, required, submit } from '@angular/forms/signals';

import { SHARED_IMPORTS } from '@shared';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../app/services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';

import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';

interface ChatBotPromptForm {
  ChatBotPromptCodigo: string;
  Descripcion: string;
  Prompt: string;
  IaTools: string;
  EsNuevo: boolean;
}

interface AgentsFormModel {
  agents: ChatBotPromptForm[];
}

@Component({
  selector: 'app-mess',
  imports: [NzModalModule,
    CommonModule,
    SHARED_IMPORTS,
    NzAffixModule,
    NzUploadModule,
    PersonalSearchComponent,
    MarkdownModule,
    FormsModule,
    FormField
  ],
  templateUrl: './mess.component.html',
  styleUrl: './mess.component.scss'
})
export class MessComponent {
  private apiService = inject(ApiService)

  messInfo = signal({ 'msg': 'descansando' })
  ultimoDeposito = signal({ 'msg': 'descansando' })
  imagenUrl = signal('')
  ms = signal(0)
  mensaje = model('')
  destino = model('')
  iaPromptHash = signal('')
  iaToolsHash = signal('')
  showTools = signal<boolean>(false);
  chatId = signal('');
  msgs = signal<any[]>([])
  agentsLoading = signal(false)
  panelAbierto = signal<number | null>(null)
  deletedAgentCodes = signal<string[]>([])

  readonly agentsModel = signal<AgentsFormModel>({ agents: [] })

  readonly agentsForm = form(this.agentsModel, p => {
    applyEach(p.agents, agent => {
      required(agent.ChatBotPromptCodigo, { message: 'El código es obligatorio' })
      required(agent.Descripcion, { message: 'La descripción es obligatoria' })
      required(agent.Prompt, { message: 'El prompt es obligatorio' })
      required(agent.IaTools, { message: 'IA Tools es obligatorio' })
    })
  })


  toggleShowTools(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.showTools.set(!!input.checked);
  }


  async getMessInfo() {
    try {
      this.messInfo.set(await firstValueFrom(this.apiService.getMessInfo()))
    } catch (e) {
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
      this.ultimoDeposito.set({ 'msg': 'error' })
    }
  }

  async enviaMensaje() {
    await firstValueFrom(this.apiService.sendMessage(this.destino(), this.mensaje()))

  }

  chatform = form(signal({
    usermsg: '',
  }), (f) => {
    required(f.usermsg)
    minLength(f.usermsg,1)
  })



  promptform = form(signal({
    iaPrompt: '',
  }), (f) => {
    required(f.iaPrompt)
    minLength(f.iaPrompt,1)
  })

  toolsform = form(signal({
    iaTools: '',
  }), (f) => {
    required(f.iaTools)
    minLength(f.iaTools,1)
  })



  async enviaChat(event: any) {
    event.preventDefault();
    await submit(this.chatform, async (form) => {
      localStorage.setItem('chatId', this.chatId())

      try {
        const resp: any = await firstValueFrom(this.apiService.sendChatMessage(this.chatform.usermsg().value(), this.chatId()))
        const newMsg: any[] = resp.response
        this.msgs.update(list => [...list, ...resp.response]);
//        form.usermsg().setControlValue('')
        this.chatform().reset({ usermsg: '' })
        
      } catch { }
      return undefined; // success
    })

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
    } catch (error) {}

    await this.loadAgents()

    const resIAPrompt: any = await firstValueFrom(this.apiService.getIaPrompt())

    this.promptform().reset({iaPrompt:resIAPrompt.data.iaPrompt})

    this.iaPromptHash.set(resIAPrompt.data.iaPromptHash)

    const resIATools: any = await firstValueFrom(this.apiService.getIaTools())
    this.toolsform().reset({iaTools:resIATools.data.iaTools})

    this.iaToolsHash.set(resIATools.data.iaToolsHash)

  }

  private setAgentsForm(data: any) {
    const agents = (data?.agents ?? []).map((agent: any): ChatBotPromptForm => ({
      ChatBotPromptCodigo: agent.ChatBotPromptCodigo ?? '',
      Descripcion: agent.Descripcion ?? '',
      Prompt: agent.Prompt ?? '',
      IaTools: agent.IaTools ?? '',
      EsNuevo: false
    }))

    this.agentsForm().reset({ agents })
    this.deletedAgentCodes.set([])
    this.panelAbierto.set(null)
  }

  async loadAgents() {
    this.agentsLoading.set(true)
    try {
      const data = await firstValueFrom(this.apiService.getChatBotAgents())
      this.setAgentsForm(data)
    } finally {
      this.agentsLoading.set(false)
    }
  }

  agentTitle(index: number): string {
    const agent = this.agentsModel().agents[index]
    if (agent?.EsNuevo && !agent?.ChatBotPromptCodigo) return 'Nuevo agente'
    const description = agent?.Descripcion || 'Sin descripción'
    return `${agent?.ChatBotPromptCodigo || 'Sin código'} - ${description}`
  }

  addAgent(event: Event) {
    event.preventDefault()
    event.stopPropagation()
    const agent: ChatBotPromptForm = {
      ChatBotPromptCodigo: '',
      Descripcion: '',
      Prompt: '',
      IaTools: '',
      EsNuevo: true
    }

    this.agentsModel.update(model => ({ ...model, agents: [...model.agents, agent] }))
    this.agentsForm().markAsDirty()
    this.panelAbierto.set(this.agentsModel().agents.length - 1)
  }

  removeAgent(index: number, event: Event) {
    event.preventDefault()
    event.stopPropagation()

    const agent = this.agentsModel().agents[index]
    if (!agent) return

    if (!agent.EsNuevo && agent.ChatBotPromptCodigo) {
      this.deletedAgentCodes.update(codes =>
        codes.includes(agent.ChatBotPromptCodigo) ? codes : [...codes, agent.ChatBotPromptCodigo]
      )
    }

    this.agentsModel.update(model => ({
      ...model,
      agents: model.agents.filter((_, i) => i !== index)
    }))
    this.agentsForm().markAsDirty()
    const agentsLength = this.agentsModel().agents.length
    this.panelAbierto.set(agentsLength > 0 ? Math.min(index, agentsLength - 1) : null)
  }

  async setAgents(event: Event) {
    event.preventDefault()
    await submit(this.agentsForm, async form => {
      const agents = form().value().agents
      const currentCodes = new Set(agents.map(agent => agent.ChatBotPromptCodigo))
      const deletedCodes = this.deletedAgentCodes().filter(code => !currentCodes.has(code))
      const data = await firstValueFrom(this.apiService.setChatBotAgents(agents, deletedCodes))
      this.setAgentsForm(data)
      return undefined
    })
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


  async setIaPrompt(event: any) {
    event.preventDefault();
    await submit(this.promptform, async (form) => {
      localStorage.setItem('chatId', this.chatId())

      try {
        const resp: any = await firstValueFrom(this.apiService.setIaPrompt(form().value().iaPrompt,this.iaPromptHash()))
        this.promptform().reset({ iaPrompt: resp.data.iaPrompt })
        this.iaPromptHash.set(resp.data.iaPromptHash)
        this.msgs.set([])
      } catch { }
      return undefined; // success
    })
  }

  async setIaTools(event: any) {
    event.preventDefault();
    await submit(this.toolsform, async (form) => {
      localStorage.setItem('chatId', this.chatId())

      try {
        const resp: any = await firstValueFrom(this.apiService.setIaTools(form().value().iaTools,this.iaToolsHash()))
        this.toolsform().reset({ iaTools: resp.data.iaTools })
        this.iaToolsHash.set(resp.data.iaToolsHash)
        this.msgs.set([])
      } catch { }
      return undefined; // success
    })
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

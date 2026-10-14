import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import type { Detection, FaceDetector } from '@mediapipe/tasks-vision';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { ApiService } from '../../../services/api.service';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';

// icons
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { CheckCircleOutline, CloseCircleOutline } from '@ant-design/icons-angular/icons';

// Estados de la pantalla de marcado: definen el mensaje y qué botón se muestra (el marcado lo
// dispara la detección de rostro, no un botón)
type EstadoMarcado = 'iniciando' | 'sinPermiso' | 'error' | 'listo' | 'marcando' | 'marcado' | 'noEncontrado' | 'confirmado'

// Dónde registra la asistencia la persona reconocida
export interface ConfirmacionForm {
  TipoLugar: string          // 'OBJ' | 'CUS'
  ObjetivoId: number | null
  CustodiaCodigo: number | null
}

// MediaPipe se sirve desde la app: angular.json copia el wasm y el modelo está en src/assets
const MEDIAPIPE_WASM = 'assets/mediapipe/wasm'
const MEDIAPIPE_MODELO = 'assets/mediapipe/models/blaze_face_short_range.tflite'

const GUIA_INICIAL = 'Ubique su rostro dentro del círculo'

// Configuración de la pantalla: viene de ParametroGeneral (ROSTR y UBICA) a través del back
export interface ConfiguracionRegistroAsistencia {
  rostro: {
    // Cada cuánto se analiza un cuadro del video, y cuánto tiene que quedarse quieto el rostro
    // bien ubicado para marcar solo
    intervaloDeteccionMs: number
    tiempoEstableMs: number
    // Ubicación del rostro, en proporción del lado del círculo (el video se recorta a un cuadrado)
    tamanioMinimoRostro: number
    desvioMaximoCentro: number
    // Confianza mínima de MediaPipe para considerar que hay un rostro (0..1)
    confianzaMinimaDeteccion: number
    // Lado de la foto que se manda al back: chica para no pasar el límite de 100 KB del back
    ladoFoto: number
    // Similitud mínima para reconocer a la persona: la usa el back, el front solo la recibe
    umbralSimilitud: number
  }
  ubicacion: {
    // Se acepta una lectura con precisión de hasta precisionMaximaMetros, y se espera hasta
    // esperaUbicacionMs cada lectura antes de informar que no se pudo obtener
    precisionMaximaMetros: number
    esperaUbicacionMs: number
    // Distancia máxima al objetivo para marcar (la valida el back cuando haya coordenadas de objetivos)
    distanciaMaximaMetros: number
  }
}

type EstadoUbicacion = 'obteniendo' | 'lista' | 'imprecisa' | 'sinPermiso' | 'error'

export interface Ubicacion {
  latitud: number
  longitud: number
  // Radio de error informado por el dispositivo, en metros
  precision: number
  momento: Date
}

@Component({
  selector: 'app-registro-asistencia-carga',
  standalone: true,
  imports: [SHARED_IMPORTS, FormField, ObjetivoSearchComponent],
  providers: [provideNzIconsPatch([CheckCircleOutline, CloseCircleOutline])],
  templateUrl: './registro-asistencia-carga.html',
  styleUrl: './registro-asistencia-carga.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroAsistenciaCargaComponent {

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video')
  private stream: MediaStream | null = null

  readonly estado = signal<EstadoMarcado>('iniciando')
  readonly detalleError = signal('')
  readonly horaMarcada = signal<Date | null>(null)
  // Con la cámara apagada (procesando o con el resultado) el video se oculta y en el círculo queda
  // la foto que se tomó, con el resultado encima
  readonly camaraEncendida = signal(false)
  readonly fotoCapturada = signal<string | null>(null)

  // Persona que reconoció el back
  readonly personaEncontrada = signal('')
  private readonly personalIdEncontrado = signal<number | null>(null)
  private readonly similitudEncontrada = signal<number | null>(null)
  // Dónde quedó registrada la asistencia, como la devolvió el back: "Objetivo: 123/1 ..." o
  // "Custodia: 456 ..."
  readonly lugarConfirmado = signal('')
  // Código del registro grabado al confirmar: es el que borra "Anular asistencia"
  private readonly registroConfirmado = signal<number | null>(null)
  readonly anulando = signal(false)

  // Confirmación: una vez reconocido, se elige el objetivo o la custodia donde se registra
  private readonly defaultConfirmacion: ConfirmacionForm = { TipoLugar: '', ObjetivoId: null, CustodiaCodigo: null }
  readonly confirmacion = signal<ConfirmacionForm>(structuredClone(this.defaultConfirmacion))
  readonly formConfirmacion = form(this.confirmacion, (p) => {
    required(p.TipoLugar, { message: 'Elija dónde registra la asistencia' })
    required(p.ObjetivoId, { message: 'Elija el objetivo', when: (ctx) => ctx.valueOf(p.TipoLugar) == 'OBJ' })
    required(p.CustodiaCodigo, { message: 'Ingrese la custodia', when: (ctx) => ctx.valueOf(p.TipoLugar) == 'CUS' })
  })

  private apiService = inject(ApiService)
  private notification = inject(NzNotificationService)
  readonly optionsTipoLugar = toSignal(this.apiService.getTiposLugarRegistroAsistencia(), { initialValue: [] })
  // Se lee al abrir la pantalla; sin ella no arranca ni la cámara ni la ubicación
  private config: ConfiguracionRegistroAsistencia | null = null

  // Detección de rostro: es lo que marca la asistencia
  private detector: FaceDetector | null = null
  private temporizadorDeteccion: ReturnType<typeof setTimeout> | null = null
  private estableDesde: number | null = null
  readonly guia = signal(GUIA_INICIAL)
  // 0..1: cuánto falta para marcar solo; se muestra llenando el anillo
  readonly progreso = signal(0)

  // Ubicación: se sigue con watchPosition, que se va afinando; al marcar se usa la última
  private vigilanciaUbicacion: number | null = null
  readonly ubicacion = signal<Ubicacion | null>(null)
  readonly estadoUbicacion = signal<EstadoUbicacion>('obteniendo')
  readonly detalleUbicacion = signal('')
  readonly linkMapa = computed(() => {
    const ubicacion = this.ubicacion()
    // /maps/place/ abre la ficha del punto, que muestra la dirección aproximada debajo de las
    // coordenadas (con ?q= solo busca las coordenadas y muchas veces no muestra la calle)
    return ubicacion ? `https://www.google.com/maps/place/${ubicacion.latitud},${ubicacion.longitud}` : ''
  })

  readonly mensaje = computed(() => {
    switch (this.estado()) {
      case 'iniciando': return 'Iniciando cámara...'
      case 'sinPermiso': return 'No hay permiso para usar la cámara. Habilítelo en el navegador y presione Reintentar.'
      case 'error': return this.detalleError()
      case 'listo': return this.guia()
      case 'marcando': return 'Registrando asistencia...'
      case 'marcado': return `Rostro encontrado: ${this.personaEncontrada()} (${this.horaMarcada()?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) ?? ''})`
      case 'noEncontrado': return 'Rostro no encontrado'
      case 'confirmado': return `Asistencia confirmada: ${this.personaEncontrada()}`
    }
  })

  // Hora del marcado en 24 hs, para la tarjeta de la persona reconocida
  readonly horaMarcadaTexto = computed(() => {
    const hora = this.horaMarcada()
    return hora ? `${hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs` : ''
  })

  readonly tipoAlerta = computed(() => {
    switch (this.estado()) {
      // Se resuelven reintentando: advertencia (naranja), no error
      case 'sinPermiso':
      case 'error': return 'warning'
      case 'noEncontrado': return 'error'
      case 'marcado':
      case 'confirmado': return 'success'
      default: return 'info'
    }
  })

  constructor() {
    // Al salir de la pantalla se apaga la cámara, la detección y el seguimiento de la ubicación
    inject(DestroyRef).onDestroy(() => {
      this.detenerUbicacion()
      this.detenerDeteccion()
      this.detector?.close()
      this.detector = null
      this.detenerCamara()
    })
  }

  ngAfterViewInit(): void {
    this.iniciar()
  }

  // Lee la configuración (si todavía no la tiene) y arranca la ubicación y la cámara. Es también lo
  // que hace Reintentar.
  async iniciar() {
    this.estado.set('iniciando')
    if (!this.config) {
      try {
        this.config = await firstValueFrom(this.apiService.getConfiguracionRegistroAsistencia())
      } catch (e: any) {
        this.mostrarError('No pudimos preparar el registro de asistencia.', 'Error al leer la configuración (ParametroGeneral ROSTR/UBICA)', e)
        return
      }
    }
    // La ubicación se pide en paralelo con la cámara, para tenerla lista al detectar el rostro
    if (this.vigilanciaUbicacion === null) this.iniciarUbicacion()
    this.iniciarCamara()
  }

  iniciarUbicacion() {
    this.detenerUbicacion()
    if (!this.config) return
    const { precisionMaximaMetros, esperaUbicacionMs } = this.config.ubicacion

    // Igual que la cámara, sin HTTPS (salvo localhost) el navegador no da la ubicación
    if (!navigator.geolocation) {
      this.detalleUbicacion.set('El navegador no permite obtener la ubicación.')
      this.estadoUbicacion.set('error')
      return
    }

    this.estadoUbicacion.set('obteniendo')
    this.vigilanciaUbicacion = navigator.geolocation.watchPosition(
      (posicion) => {
        const ubicacion: Ubicacion = {
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precision: Math.round(posicion.coords.accuracy),
          momento: new Date(posicion.timestamp),
        }
        this.ubicacion.set(ubicacion)
        this.estadoUbicacion.set(ubicacion.precision <= precisionMaximaMetros ? 'lista' : 'imprecisa')
        // No se informa acá: watchPosition manda una lectura cada vez que la posición se afina, y
        // se repetiría. Se informa una vez, la que se usa, al marcar.
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          this.estadoUbicacion.set('sinPermiso')
          console.log('[registro-asistencia] Ubicación: sin permiso')
          return
        }
        // Con una lectura ya obtenida, un tiempo agotado no se informa: se sigue con la última
        if (this.ubicacion()) return
        this.detalleUbicacion.set(error.code === error.TIMEOUT
          ? 'No se pudo obtener la ubicación (tiempo agotado).'
          : `No se pudo obtener la ubicación: ${error.message}`)
        this.estadoUbicacion.set('error')
        console.log('[registro-asistencia] Ubicación: error', this.detalleUbicacion())
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: esperaUbicacionMs }
    )
  }

  private detenerUbicacion() {
    if (this.vigilanciaUbicacion !== null) navigator.geolocation.clearWatch(this.vigilanciaUbicacion)
    this.vigilanciaUbicacion = null
  }

  async iniciarCamara() {
    this.estado.set('iniciando')
    this.fotoCapturada.set(null)
    this.detenerDeteccion()
    this.detenerCamara()

    // Sin HTTPS (salvo localhost) el navegador no expone la cámara
    if (!navigator.mediaDevices?.getUserMedia) {
      this.mostrarError('La cámara no está disponible en este navegador.', 'navigator.mediaDevices.getUserMedia no existe: la página debe abrirse por HTTPS')
      return
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      const video = this.video().nativeElement
      video.srcObject = this.stream
      await video.play()
      this.camaraEncendida.set(true)
      this.estado.set('listo')
      this.iniciarDeteccion()
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        this.estado.set('sinPermiso')
        this.notification.warning('Advertencia', 'No hay permiso para usar la cámara. Habilítelo en el navegador y presione Reintentar.')
        return
      }
      this.mostrarError(e?.name === 'NotFoundError'
        ? 'No encontramos una cámara en el dispositivo.'
        : 'No pudimos encender la cámara. Verifique que no la esté usando otra aplicación.',
        'Error al iniciar la cámara', e)
    }
  }

  async marcar() {
    if (this.estado() !== 'listo') return
    this.detenerDeteccion()
    this.estado.set('marcando')

    const foto = this.capturarFoto()
    const ubicacion = this.ubicacion()

    // La línea de ubicación de la pantalla está comentada: por ahora se informa por consola, una
    // vez por marcado (la que se manda al back)
    console.log('[registro-asistencia] Ubicación del marcado', ubicacion
      ? { ...ubicacion, estado: this.estadoUbicacion(), mapa: this.linkMapa() }
      : { estado: this.estadoUbicacion(), detalle: this.detalleUbicacion() })

    // Con la foto tomada se apaga la cámara: queda apagada mientras se busca la coincidencia y
    // también si se reconoce a la persona; en el círculo queda la foto. Solo la vuelven a encender
    // los botones de reintento.
    this.fotoCapturada.set(foto)
    this.detenerCamara()

    // El back compara el rostro con las fotos del personal. Por ahora solo informa: no graba nada.
    try {
      const inicioAnalisis = performance.now()
      const respuesta = await firstValueFrom(this.apiService.marcarRegistroAsistencia({ foto, ubicacion }))

      // Tiempo de análisis de la foto: el total visto desde el front (incluye la red) y el detalle
      // del back (poner al día la galería y analizar la foto del marcado)
      const tiempoAnalisis = {
        totalMs: Math.round(performance.now() - inicioAnalisis),
        ...respuesta?.tiempos,
      }
      console.log('[registro-asistencia] Tiempo de análisis de la foto', tiempoAnalisis)

      this.horaMarcada.set(new Date())
      this.personaEncontrada.set(respuesta?.ApellidoNombre || `PersonalId ${respuesta?.PersonalId}`)
      this.personalIdEncontrado.set(respuesta?.PersonalId ?? null)
      this.similitudEncontrada.set(respuesta?.similitud ?? null)
      this.estado.set(respuesta?.encontrado ? 'marcado' : 'noEncontrado')
    } catch (e: any) {
      this.mostrarError('No pudimos verificar su rostro.', 'Error al reconocer el rostro (/marcar)', e)
    }
  }

  // Confirma la asistencia de la persona reconocida en el objetivo o la custodia elegidos
  async confirmarAsistencia() {
    if (this.estado() !== 'marcado' || this.formConfirmacion().submitting() || !this.formConfirmacion().valid()) return

    await submit(this.formConfirmacion, async (form) => {
      try {
        const respuesta = await firstValueFrom(this.apiService.confirmarRegistroAsistencia({
          ...form().value(),
          PersonalId: this.personalIdEncontrado(),
          ApellidoNombre: this.personaEncontrada(),
          similitud: this.similitudEncontrada(),
          ubicacion: this.ubicacion(),
        }))
        const tipo = this.optionsTipoLugar().find((option: any) => option.value === form().value().TipoLugar)?.label ?? ''
        this.lugarConfirmado.set(`${tipo}: ${respuesta?.data?.LugarDescripcion ?? ''}`)
        this.registroConfirmado.set(respuesta?.data?.RegistroAsistenciaCodigo ?? null)
        this.estado.set('confirmado')
      } catch (e: any) {
        return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors)
      }
      return undefined
    })
  }

  // Borra el registro recién confirmado y vuelve a la cámara. Si el back rechaza, el interceptor
  // muestra el error arriba y la pantalla queda como estaba.
  async anularAsistencia() {
    const RegistroAsistenciaCodigo = this.registroConfirmado()
    if (this.estado() !== 'confirmado' || !RegistroAsistenciaCodigo || this.anulando()) return

    this.anulando.set(true)
    try {
      await firstValueFrom(this.apiService.anularRegistroAsistencia(RegistroAsistenciaCodigo))
      this.notification.success('Respuesta', 'Asistencia anulada')
      this.nuevoRegistro()
    } catch (e) {
      console.error('[registro-asistencia] Error al anular la asistencia', e)
    } finally {
      this.anulando.set(false)
    }
  }

  // La persona indica que la reconocieron mal: se descarta el reconocimiento y se vuelve a la
  // cámara. Queda en consola para revisar el umbral de similitud con casos reales.
  noSoyYo() {
    console.warn('[registro-asistencia] Reconocimiento rechazado por la persona ("No soy yo")', {
      PersonalId: this.personalIdEncontrado(),
      ApellidoNombre: this.personaEncontrada(),
      similitud: this.similitudEncontrada(),
    })
    this.nuevoRegistro()
  }

  // Error para el usuario: en pantalla un mensaje simple que invita a reintentar; el detalle técnico
  // (lo que respondió el back, el error del navegador, etc.) va a la consola
  // Además se muestra arriba con la notificación del sistema, salvo los errores del back: esos ya los
  // muestra el interceptor HTTP (core/net) y saldrían dos veces.
  private mostrarError(mensaje: string, contexto: string, detalle?: unknown) {
    console.error(`[registro-asistencia] ${contexto}`, detalle ?? '')
    this.detalleError.set(`${mensaje} Presione Reintentar.`)
    this.estado.set('error')
    if (!(detalle instanceof HttpErrorResponse))
      this.notification.error('Error', mensaje)
  }

  // Limpia el marcado anterior y vuelve a encender la cámara (que se apagó al tomar la foto)
  nuevoRegistro() {
    this.horaMarcada.set(null)
    this.personaEncontrada.set('')
    this.personalIdEncontrado.set(null)
    this.similitudEncontrada.set(null)
    this.lugarConfirmado.set('')
    this.registroConfirmado.set(null)
    this.confirmacion.set(structuredClone(this.defaultConfirmacion))
    this.formConfirmacion().reset()
    this.iniciarCamara()
  }

  // Carga MediaPipe la primera vez (import dinámico: no pesa en el resto de la app) y arranca
  // el análisis de cuadros. Sin detección no hay forma de marcar: se informa como error, y
  // Reintentar vuelve a intentarlo.
  private async iniciarDeteccion() {
    try {
      this.detector ??= await this.crearDetector()
    } catch (e: any) {
      this.mostrarError('No pudimos preparar la detección de rostros.', 'Error al iniciar MediaPipe', e)
      return
    }
    this.reiniciarProgreso(GUIA_INICIAL)
    this.programarDeteccion()
  }

  private async crearDetector(): Promise<FaceDetector> {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM)
    const opciones = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MEDIAPIPE_MODELO, delegate },
      runningMode: 'VIDEO' as const,
      minDetectionConfidence: this.config!.rostro.confianzaMinimaDeteccion,
    })
    // La GPU es más rápida pero no está en todos los dispositivos
    try {
      return await FaceDetector.createFromOptions(fileset, opciones('GPU'))
    } catch {
      return await FaceDetector.createFromOptions(fileset, opciones('CPU'))
    }
  }

  private programarDeteccion() {
    this.detenerDeteccion()
    this.temporizadorDeteccion = setTimeout(() => this.detectar(), this.config!.rostro.intervaloDeteccionMs)
  }

  private detenerDeteccion() {
    if (this.temporizadorDeteccion) clearTimeout(this.temporizadorDeteccion)
    this.temporizadorDeteccion = null
  }

  // Analiza el cuadro actual: con el rostro bien ubicado avanza el progreso y, al completarse,
  // marca solo; si no, indica qué corregir y el progreso vuelve a cero
  private detectar() {
    this.temporizadorDeteccion = null
    if (this.estado() !== 'listo' || !this.detector) return

    const video = this.video().nativeElement
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const ahora = performance.now()
      const { detections } = this.detector.detectForVideo(video, ahora)
      const correccion = this.evaluarRostro(detections, video.videoWidth, video.videoHeight)

      if (correccion) {
        this.reiniciarProgreso(correccion)
      } else {
        this.guia.set('Mantenga la posición...')
        this.estableDesde ??= ahora
        const progreso = Math.min((ahora - this.estableDesde) / this.config!.rostro.tiempoEstableMs, 1)
        this.progreso.set(progreso)
        if (progreso >= 1) {
          this.marcar()
          return
        }
      }
    }
    this.programarDeteccion()
  }

  // Qué tiene que corregir la persona, o null si el rostro está bien ubicado
  private evaluarRostro(detections: Detection[], ancho: number, alto: number): string | null {
    if (detections.length === 0) return GUIA_INICIAL
    if (detections.length > 1) return 'Debe haber una sola persona frente a la cámara'

    const caja = detections[0].boundingBox
    if (!caja) return GUIA_INICIAL

    // El círculo muestra el cuadrado central del video
    const { tamanioMinimoRostro, desvioMaximoCentro } = this.config!.rostro
    const lado = Math.min(ancho, alto)
    if (caja.width / lado < tamanioMinimoRostro) return 'Acérquese a la cámara'

    const desvioX = Math.abs(caja.originX + caja.width / 2 - ancho / 2) / lado
    const desvioY = Math.abs(caja.originY + caja.height / 2 - alto / 2) / lado
    if (desvioX > desvioMaximoCentro || desvioY > desvioMaximoCentro) return 'Centre el rostro en el círculo'

    return null
  }

  private reiniciarProgreso(guia: string) {
    this.guia.set(guia)
    this.estableDesde = null
    this.progreso.set(0)
  }

  // Recorte cuadrado central del video (lo que se ve en el círculo) como JPEG de ladoFoto x
  // ladoFoto, sin espejar (la vista sí se muestra espejada)
  private capturarFoto(): string {
    const video = this.video().nativeElement
    const ladoFoto = this.config!.rostro.ladoFoto
    const lado = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = ladoFoto
    canvas.height = ladoFoto
    canvas.getContext('2d')?.drawImage(video,
      (video.videoWidth - lado) / 2, (video.videoHeight - lado) / 2, lado, lado,
      0, 0, ladoFoto, ladoFoto)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  private detenerCamara() {
    this.stream?.getTracks().forEach(track => track.stop())
    this.stream = null
    this.camaraEncendida.set(false)
  }
}

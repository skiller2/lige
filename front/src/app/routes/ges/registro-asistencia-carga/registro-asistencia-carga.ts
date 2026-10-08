import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import type { Detection, FaceDetector } from '@mediapipe/tasks-vision';

// icons
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { CheckCircleOutline } from '@ant-design/icons-angular/icons';

// Estados de la pantalla de marcado: definen el mensaje y qué botón se muestra (el marcado lo
// dispara la detección de rostro, no un botón)
type EstadoMarcado = 'iniciando' | 'sinPermiso' | 'error' | 'listo' | 'marcando' | 'marcado'

// MediaPipe se sirve desde la app: angular.json copia el wasm y el modelo está en src/assets
const MEDIAPIPE_WASM = 'assets/mediapipe/wasm'
const MEDIAPIPE_MODELO = 'assets/mediapipe/models/blaze_face_short_range.tflite'

// Cada cuánto se analiza un cuadro del video, y cuánto tiene que quedarse quieto el rostro bien
// ubicado para marcar solo
const INTERVALO_DETECCION_MS = 200
const TIEMPO_ESTABLE_MS = 1000

// Ubicación del rostro, en proporción del lado del círculo (el video se recorta a un cuadrado)
const TAMANIO_MINIMO_ROSTRO = 0.40
const DESVIO_MAXIMO_CENTRO = 0.10

const GUIA_INICIAL = 'Ubique su rostro dentro del círculo'

// Ubicación: se acepta una lectura con precisión de hasta PRECISION_MAXIMA_M metros, y se espera
// hasta ESPERA_UBICACION_MS cada lectura antes de informar que no se pudo obtener
const PRECISION_MAXIMA_M = 100
const ESPERA_UBICACION_MS = 15000

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
  imports: [SHARED_IMPORTS],
  providers: [provideNzIconsPatch([CheckCircleOutline])],
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
      case 'marcado': return `Asistencia registrada ${this.horaMarcada()?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) ?? ''}`
    }
  })

  readonly tipoAlerta = computed(() => {
    switch (this.estado()) {
      case 'sinPermiso':
      case 'error': return 'error'
      case 'marcado': return 'success'
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
    // La ubicación se pide en paralelo con la cámara, para tenerla lista al detectar el rostro
    this.iniciarUbicacion()
    this.iniciarCamara()
  }

  iniciarUbicacion() {
    this.detenerUbicacion()

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
        this.estadoUbicacion.set(ubicacion.precision <= PRECISION_MAXIMA_M ? 'lista' : 'imprecisa')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          this.estadoUbicacion.set('sinPermiso')
          return
        }
        // Con una lectura ya obtenida, un tiempo agotado no se informa: se sigue con la última
        if (this.ubicacion()) return
        this.detalleUbicacion.set(error.code === error.TIMEOUT
          ? 'No se pudo obtener la ubicación (tiempo agotado).'
          : `No se pudo obtener la ubicación: ${error.message}`)
        this.estadoUbicacion.set('error')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: ESPERA_UBICACION_MS }
    )
  }

  private detenerUbicacion() {
    if (this.vigilanciaUbicacion !== null) navigator.geolocation.clearWatch(this.vigilanciaUbicacion)
    this.vigilanciaUbicacion = null
  }

  async iniciarCamara() {
    this.estado.set('iniciando')
    this.detenerDeteccion()
    this.detenerCamara()

    // Sin HTTPS (salvo localhost) el navegador no expone la cámara
    if (!navigator.mediaDevices?.getUserMedia) {
      this.detalleError.set('El navegador no permite usar la cámara. Debe accederse por HTTPS.')
      this.estado.set('error')
      return
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      const video = this.video().nativeElement
      video.srcObject = this.stream
      await video.play()
      this.estado.set('listo')
      this.iniciarDeteccion()
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        this.estado.set('sinPermiso')
        return
      }
      this.detalleError.set(e?.name === 'NotFoundError'
        ? 'No se encontró una cámara en el dispositivo.'
        : `No se pudo iniciar la cámara: ${e?.message ?? e}`)
      this.estado.set('error')
    }
  }

  async marcar() {
    if (this.estado() !== 'listo') return
    this.detenerDeteccion()
    this.estado.set('marcando')

    const foto = this.capturarFoto()
    const ubicacion = this.ubicacion()
    // TODO: enviar la foto y la ubicación al back para el reconocimiento facial, la validación
    // del lugar y el registro de la asistencia
    console.log('Marcado', { fotoBytes: foto.length, ubicacion })
    await new Promise(resolve => setTimeout(resolve, 1000))   // Simula la respuesta del back

    this.horaMarcada.set(new Date())
    this.estado.set('marcado')
  }

  nuevoRegistro() {
    this.horaMarcada.set(null)
    this.reiniciarProgreso(GUIA_INICIAL)
    this.estado.set('listo')
    this.programarDeteccion()
  }

  // Carga MediaPipe la primera vez (import dinámico: no pesa en el resto de la app) y arranca
  // el análisis de cuadros. Sin detección no hay forma de marcar: se informa como error, y
  // Reintentar vuelve a intentarlo.
  private async iniciarDeteccion() {
    try {
      this.detector ??= await this.crearDetector()
    } catch (e: any) {
      console.error('No se pudo iniciar la detección de rostros', e)
      this.detalleError.set(`No se pudo iniciar la detección de rostros: ${e?.message ?? e}`)
      this.estado.set('error')
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
      minDetectionConfidence: 0.6,
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
    this.temporizadorDeteccion = setTimeout(() => this.detectar(), INTERVALO_DETECCION_MS)
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
        const progreso = Math.min((ahora - this.estableDesde) / TIEMPO_ESTABLE_MS, 1)
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
    const lado = Math.min(ancho, alto)
    if (caja.width / lado < TAMANIO_MINIMO_ROSTRO) return 'Acérquese a la cámara'

    const desvioX = Math.abs(caja.originX + caja.width / 2 - ancho / 2) / lado
    const desvioY = Math.abs(caja.originY + caja.height / 2 - alto / 2) / lado
    if (desvioX > DESVIO_MAXIMO_CENTRO || desvioY > DESVIO_MAXIMO_CENTRO) return 'Centre el rostro en el círculo'

    return null
  }

  private reiniciarProgreso(guia: string) {
    this.guia.set(guia)
    this.estableDesde = null
    this.progreso.set(0)
  }

  // Cuadro actual del video como JPEG (sin espejar: la vista sí se muestra espejada)
  private capturarFoto(): string {
    const video = this.video().nativeElement
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.9)
  }

  private detenerCamara() {
    this.stream?.getTracks().forEach(track => track.stop())
    this.stream = null
  }
}

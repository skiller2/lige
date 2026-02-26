import { Injectable } from '@angular/core';

/** Pequeño diccionario español sin acentos/ñ para contraseñas amigables. */
const SP_WORDS: string[] = [
  'agua','aire','alba','alma','alto','amigo','andar','angel','anillo','arbol',
  'arena','arte','ave','avion','azul','barco','barro','bello','beso','blanco',
  'boca','borde','brisa','bronce','bueno','cafe','calma','campo','canto','casa',
  'cerca','chico','cielo','claro','clave','cobre','coco','color','coral','corte',
  'costa','creer','cruz','cuadro','cumbre','curso','dado','dama','danza','dedo',
  'delta','deseo','dia','dicha','diente','dios','dorado','dulce','eco','estrella',
  'faro','feliz','fiel','firme','flor','fondo','frio','fuego','fuerte','gallo',
  'gente','giro','gorro','gracia','grande','gris','grupo','guitarra','hablar',
  'hada','hijo','hilo','hogar','hoja','hondo','honor','huevo','humo','ideal',
  'isla','junto','joven','juego','karma','lado','lago','largo','lata','lector',
  'leon','leve','libro','lima','limon','lindo','llave','lobo','lote','lucha',
  'lugar','luna','luz','madre','magia','mando','mano','mar','marea','marmol',
  'martin','mayo','media','mejor','mente','mesa','metal','metro','miel','mina',
  'mirar','moda','mono','mora','moto','museo','nacer','nadar','nave','negar',
  'negro','nene','nido','nieve','noble','noche','norte','nota','nube','nuevo',
  'obra','ocaso','oeste','ola','olivo','olor','oro','pacto','pago','palo','palma',
  'pan','papel','par','paz','pelea','pelo','pena','perla','pez','piano','pico',
  'pie','piedra','piel','pino','pista','plata','plaza','pleno','pluma','poder',
  'poeta','polen','pollo','prado','prisa','puente','pulso','punto','radio','raro',
  'rayo','reina','reloj','reto','rio','ritmo','roca','rojo','roma','rosa','rostro',
  'ruta','saber','sabor','sala','salir','salto','salud','seda','seguro','selva',
  'senda','ser','serie','serio','siglo','signo','silla','simple','sitio','sol',
  'solo','son','suave','sur','tacto','tarde','taza','techo','tecla','tejido',
  'tema','templo','tenor','tesoro','tibio','tierra','tigre','tinta','tipo','tiza',
  'tocar','toldo','tono','torre','torta','trama','tregua','trigo','trono','truco',
  'tuerca','tumba','unico','uva','valor','vapor','vasto','verde','verano','verso',
  'viento','vigor','villa','vino','visita','viva','vivo','vocal','voto','yate',
  'yema','yoga','zafa','zorro'
];

export type FriendlyDeriveOptions = {
  /** Cantidad de palabras (3..6). Default 4 */
  words?: number;
  /** Iteraciones PBKDF2. Default 210k */
  iterations?: number;
  /** Bytes del hash para mapear palabras. Default 32 (256 bits) */
  hashBytes?: number;
  /** Separador visual. Default '-' */
  sep?: string;
  /** Agregar 2 dígitos al final. Default true */
  suffixDigits?: boolean;
};

@Injectable({ providedIn: 'root' })
export class PasswordDerivationService {

  /**
   * Deriva una contraseña amigable (español) a partir de CUIT, PersonalId y una salt numérica.
   * No se normaliza CUIT ni PersonalId: se usan tal cual llegan.
   */
  async deriveFriendly(
    cuit: string,
    personalId: string,
    saltNumber: number,
    opts: FriendlyDeriveOptions = {}
  ): Promise<string> {
    const {
      words = 4,
      iterations = 210_000,
      hashBytes = 32,
      sep = '-',
      suffixDigits = true,
    } = opts;

    if (!cuit || !personalId) {
      throw new Error('CUIT y PersonalId son obligatorios');
    }
    if (!Number.isFinite(saltNumber)) {
      throw new Error('Salt debe ser un numero');
    }

    // Secret base (SIN normalizar)
    const baseSecret = `${cuit}:${personalId}`;

    // Salt textual a partir del número corto (permite versionado futuro con el prefijo)
    const saltString = `app-salt-v1:${saltNumber}`;
    const saltBytes = new TextEncoder().encode(saltString);

    // 1) Importar "key material"
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(baseSecret),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // 2) PBKDF2/SHA-256
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: saltBytes,
        iterations,
      },
      keyMaterial,
      hashBytes * 8
    );
    const bytes = new Uint8Array(derivedBits);

    // 3) Mapear bytes a indices del diccionario
    const dict = SP_WORDS;
    const idxs = this.bytesToIndices(bytes, words, dict.length);
    const chosen = idxs.map(i => dict[i]);

    // 4) Sufijo de 2 dígitos
    let suffix = '';
    if (suffixDigits) {
      const a = bytes[bytes.length - 2] % 10;
      const b = bytes[bytes.length - 1] % 10;
      suffix = `${a}${b}`;
    }

    return suffixDigits ? `${chosen.join(sep)}${sep}${suffix}` : chosen.join(sep);
  }

  /** Convierte bytes en indices 0..mod-1 (reducción simple 16‑bit → mod). */
  private bytesToIndices(bytes: Uint8Array, count: number, mod: number): number[] {
    const out: number[] = [];
    let i = 0;
    while (out.length < count && i + 1 < bytes.length) {
      const n = (bytes[i] << 8) | bytes[i + 1]; // 0..65535
      out.push(n % mod);
      i += 2;
    }
    // fallback por si faltaran índices (improbable con 32+ bytes)
    while (out.length < count) {
      out.push(bytes[out.length % bytes.length] % mod);
    }
    return out;
  }
}
import { HttpHeaders, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { ALAIN_I18N_TOKEN } from '@delon/theme';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface ReThrowHttpError {
  body: any;
  _throw: true;
}

export const CODEMESSAGE: { [key: number]: string } = {
  200: 'Respuesta OK.',
  201: 'Se modificó correctamente.',
  202: 'Ingresando tarea asincrónica.',
  204: 'Se eliminó exitosamente.',
  400: 'Error en la solicitud, no se realizaron modificaciones.',
  401: 'El usuario no tiene permiso (token, nombre de usuario, contraseña incorrecta).',
  403: 'El usuario está autorizado, pero el acceso está prohibido.',
  404: 'La solicitud enviada es para un registro que no existe.',
  406: 'El formato solicitado no está disponible.',
  410: 'El recurso solicitado se elimina de forma permanente y ya no estará disponible.',
  422: 'Al crear un objeto, se produjo un error de validación.',
  500: 'Ocurrió un error en el servidor, verifique el servidor.',
  502: 'Error de puerta de enlace.',
  503: 'El servicio no está disponible, el servidor está sobrecargado o mantenido temporalmente.',
  504: 'Tiempo de espera de puerta de enlace.',
};

export function goTo(injector: Injector, url: string): void {
  setTimeout(() => injector.get(Router).navigateByUrl(url));
}

export function toLogin(injector: Injector): void {
  //  injector.get(NzNotificationService).error(`未登录或登录已过期，请重新登录。`, ``);
  injector.get(NzNotificationService).remove('')
  injector.get(NzNotificationService).error(`Requiere volver a autenticarse.`, ``);
  goTo(injector, injector.get(DA_SERVICE_TOKEN).login_url!);
}

export function getAdditionalHeaders(headers?: HttpHeaders): { [name: string]: string } {
  const res: { [name: string]: string } = {};
  const lang = inject(ALAIN_I18N_TOKEN).currentLang;
  if (!headers?.has('Accept-Language') && lang) {
    res['Accept-Language'] = lang;
  }
  res['ngsw-bypass'] = '1';
  return res;
}

export function checkStatus(injector: Injector, ev: HttpResponseBase): void {
  if ((ev.status >= 200 && ev.status < 300) || ev.status === 401) {
    return;
  }

//  const errortext = CODEMESSAGE[ev.status] || ev.statusText;
//  injector.get(NzNotificationService).error(`请求错误 ${ev.status}: ${ev.url}`, errortext);
}
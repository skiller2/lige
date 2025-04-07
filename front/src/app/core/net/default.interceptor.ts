import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponseBase } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { IGNORE_BASE_URL, _HttpClient } from '@delon/theme';
import { environment } from '@env/environment';
import { Observable, of, throwError, mergeMap, catchError } from 'rxjs';

import { CODEMESSAGE, ReThrowHttpError, checkStatus, getAdditionalHeaders, toLogin } from './helper';
import { tryRefreshToken } from './refresh-token';
import { NzNotificationService } from 'ng-zorro-antd/notification';

function handleData(injector: Injector, ev: HttpResponseBase, req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> {
  checkStatus(injector, ev);
  // 业务处理：一些通用操作
  switch (ev.status) {
    case 200:
      // 业务层级错误处理，以下是假定restful有一套统一输出格式（指不管成功与否都有相应的数据格式）情况下进行处理
      // 例如响应内容：
      //  错误内容：{ status: 1, msg: '非法参数' }
      //  正确内容：{ status: 0, response: {  } }
      // 则以下代码片断可直接适用
      // if (ev instanceof HttpResponse) {
      //   const body = ev.body;
      //   if (body && body.status !== 0) {
      //     const customError = req.context.get(CUSTOM_ERROR);
      //     if (customError) injector.get(NzMessageService).error(body.msg);
      //     return customError ? throwError(() => ({ body, _throw: true }) as ReThrowHttpError) : of({});
      //   } else {
      //     // 返回原始返回体
      //     if (req.context.get(RAW_BODY) || ev.body instanceof Blob) {
      //       return of(ev);
      //     }
      //     // 重新修改 `body` 内容为 `response` 内容，对于绝大多数场景已经无须再关心业务状态码
      //     return of(new HttpResponse({ ...ev, body: body.response } as any));
      //     // 或者依然保持完整的格式
      //     return of(ev);
      //   }
      // }
      break;
    case 401:
      if (environment.api.refreshTokenEnabled && environment.api.refreshTokenType === 're-request') {
        return tryRefreshToken(injector, ev, req, next);
      }
      toLogin(injector);
      break;
    case 403:
    case 404:
    case 409:
    case 500:
      // goTo(injector, `/exception/${ev.status}?url=${req.urlWithParams}`);
      break;
    default:
      if (ev instanceof HttpErrorResponse) {
        console.warn(
          'Errores desconocidos, principalmente causados ​​por el backend que no admite CORS entre dominios o una configuración no válida',
          ev
        );
      }
      break;
  }
  if (ev instanceof HttpErrorResponse) {
    return throwError(() => ev);
  } else if ((ev as unknown as ReThrowHttpError)._throw === true) {
    return throwError(() => (ev as unknown as ReThrowHttpError).body);
  } else {
    return of(ev);
  }
}

function handleDataError(injector: Injector, err: HttpErrorResponse, req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> {
  switch (err.status) {
    case 401:
      if (environment.api.refreshTokenEnabled && environment.api.refreshTokenType === 're-request') {
        return tryRefreshToken(injector, err, req, next);
      }
      toLogin(injector);
      break;
    case 400:
      const warningMessage = err.error?.msg || CODEMESSAGE[400] || 'Solicitud incorrecta';
      injector.get(NzNotificationService).warning(`Advertencia`, warningMessage);
      break;
    default:
      if (err.error instanceof Blob) {
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.readyState === 2) {
            const res = JSON.parse(String(e.target.result))
            injector.get(NzNotificationService).error(`Error`, res.msg)
          }
        }
        reader.readAsText(err.error);
        break;
      }



      let errortext = err.error?.msg ? err.error.msg : CODEMESSAGE[err.status] || err.statusText

      if (Array.isArray(errortext)) {
        errortext = errortext.join('<br />')
      }

      injector.get(NzNotificationService).error(`Error`, errortext)
      break;
  }

  return throwError(() => err);
}


export const defaultInterceptor: HttpInterceptorFn = (req, next) => {
  // 统一加上服务端前缀
  let url = req.url;
  if (!req.context.get(IGNORE_BASE_URL) && !url.startsWith('https://') && !url.startsWith('http://')) {
    const { baseUrl } = environment.api;
    url = baseUrl + (baseUrl.endsWith('/') && url.startsWith('/') ? url.substring(1) : url);
  }
  const newReq = req.clone({ url, setHeaders: getAdditionalHeaders(req.headers) });
  const injector = inject(Injector);

  return next(newReq).pipe(
    mergeMap(ev => {
      // 允许统一对请求错误处理
      if (ev instanceof HttpResponseBase) {
        return handleData(injector, ev, newReq, next);
      }
      // 若一切都正常，则后续操作
      return of(ev);
    }),
    catchError((err: HttpErrorResponse) => handleDataError(injector, err, newReq, next))
  );
};
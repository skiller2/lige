import { HttpContextToken } from '@angular/common/http';
export const SILENT_NOTIFICATION_ERROR = new HttpContextToken<boolean>(() => false);

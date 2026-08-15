import { request } from './helper';
import type { Response } from '@/types/response';

export interface AppSetting {
  settingKey: string;
  settingValue: string;
  description?: string | null;
  updatedAt?: string;
  updatedBy?: number | null;
}

const APP_SETTING_BASE = import.meta.env.VITE_APP_API_URL + "/app-setting";

export function getAppSettings(): Promise<Response<AppSetting[]>> {
  return request<Response<AppSetting[]>>(APP_SETTING_BASE);
}

export function updateAppSetting(
  key: string,
  settingValue: string
): Promise<Response<AppSetting>> {
  return request<Response<AppSetting>>(`${APP_SETTING_BASE}/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ settingValue }),
  });
}

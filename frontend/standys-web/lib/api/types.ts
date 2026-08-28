export interface ApiResponse<T> {
  data: T | null;
  meta: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}
export interface NestErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface NestResponse<T> {
  success: boolean;
  data: T;
  meta?: T;
}

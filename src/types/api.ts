// Standardized API Response Layout
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

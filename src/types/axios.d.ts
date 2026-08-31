import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Suppress the automatic error toast shown by the response interceptor. */
    suppressToast?: boolean
    /** Do not trigger the global "session expired" handler on a 401 for this request. */
    skipAuthHandler?: boolean
  }
}

import axios from 'axios'
import { toast } from 'sonner'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

let isRedirectingToLogin = false

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/login') || error.config?.url?.includes('/register')

    if (
      error.response?.data?.message === 'Unauthenticated.' &&
      !isAuthEndpoint &&
      !error.config?.skipAuthRedirect &&
      !isRedirectingToLogin
    ) {
      isRedirectingToLogin = true
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      toast.error('انتهت جلستك، يرجى تسجيل الدخول مجدداً')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return Promise.reject(error)
    }

    const suppressToast = Boolean(
      error.config?.headers?.['X-Suppress-Error-Toast'] || error.config?.suppressToast,
    )

    if (!suppressToast) {
      if (error.response?.status >= 400) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          `خطأ في الخادم (${error.response?.status})`
        toast.error(errorMessage)
      } else if (!error.response) {
        toast.error('خطأ في الاتصال بالخادم - تحقق من اتصال الشبكة')
      } else {
        toast.error('حدث خطأ غير متوقع')
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient

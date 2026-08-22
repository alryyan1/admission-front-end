import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Card, Input, Button, ConfigProvider, Typography } from 'antd'
import { ModeToggle } from '@/components/common/ModeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useAntTheme } from '@/lib/antdTheme'

export function LoginPage() {
  const antTheme = useAntTheme()
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await login({ username, password })
      navigate(from, { replace: true })
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        setError('تعذر الاتصال بالخادم، تحقق من اتصال الشبكة')
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    }
  }

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <ModeToggle className="absolute end-4 top-4" />
        <Card className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <img src="/logo.png" alt="Jawda Inpatient" className="mb-2 h-32 w-32 object-contain" />
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              تسجيل الدخول
            </Typography.Title>
            <Typography.Text type="secondary">نظام التنويم </Typography.Text>
          </div>
          <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username">اسم المستخدم</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password">كلمة المرور</label>
              <Input.Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <Typography.Text type="danger">{error}</Typography.Text>}
            <Button type="primary" htmlType="submit" loading={isLoading} block className="mt-2">
              دخول
            </Button>
          </form>
        </Card>
      </div>
    </ConfigProvider>
  )
}

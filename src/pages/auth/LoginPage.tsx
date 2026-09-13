import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Card, Input, Button, ConfigProvider, Typography, theme } from 'antd'
import { ModeToggle } from '@/components/common/ModeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useAntTheme } from '@/lib/antdTheme'

export function LoginPage() {
  const antTheme = useAntTheme()

  return (
    <ConfigProvider direction="ltr" theme={antTheme}>
      <LoginScreen />
    </ConfigProvider>
  )
}

function LoginScreen() {
  const { token } = theme.useToken()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور')
      return
    }
    setSubmitting(true)
    try {
      await login({ username, password })
      navigate(from, { replace: true })
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        setError('تعذر الاتصال بالخادم، تحقق من اتصال الشبكة')
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{
        background: `radial-gradient(120% 120% at 50% 0%, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 45%, ${token.colorBgLayout} 100%)`,
      }}
    >
      <div className="absolute end-4 top-4">
        <ModeToggle />
      </div>
      <Card
        className="w-full max-w-sm"
        style={{ boxShadow: token.boxShadowSecondary }}
        styles={{ body: { padding: token.paddingXL } }}
      >
        <div className="flex flex-col items-center text-center">
   
            <img
              src="/logo.png"
              alt="Jawda Inpatient"
              className="object-contain"
            />
        
          <Typography.Text type="secondary">نظام التنويم</Typography.Text>
        </div>

        <form
          className="flex flex-col"
          style={{ gap: token.margin, marginTop: token.marginLG }}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col" style={{ gap: token.marginXXS }}>
            <label htmlFor="username">اسم المستخدم</label>
            <Input
              id="username"
              size="large"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
              required
            />
          </div>
          <div className="flex flex-col" style={{ gap: token.marginXXS }}>
            <label htmlFor="password">كلمة المرور</label>
            <Input.Password
              id="password"
              size="large"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
              required
            />
          </div>
          {error && (
            <Typography.Text id="login-error" type="danger" role="alert">
              {error}
            </Typography.Text>
          )}
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitting}
            block
            style={{ marginTop: token.marginXS }}
          >
            دخول
          </Button>
        </form>
      </Card>
    </div>
  )
}

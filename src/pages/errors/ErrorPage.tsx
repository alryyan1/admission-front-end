import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'
import { Card, Button, ConfigProvider, Typography } from 'antd'
import { ModeToggle } from '@/components/common/ModeToggle'
import { useAntTheme } from '@/lib/antdTheme'

export function ErrorPage() {
  const antTheme = useAntTheme()
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  const code = is404 ? '404' : 'خطأ'
  const title = is404 ? 'الصفحة غير موجودة' : 'حدث خطأ غير متوقع'
  const description = is404
    ? 'الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.'
    : 'عذرًا، حدث خطأ أثناء تحميل الصفحة. حاول تحديث الصفحة أو العودة إلى الرئيسية.'

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <ModeToggle className="absolute end-4 top-4" />
        <Card className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="mb-2 h-12 w-12 text-destructive" />
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              {code}
            </Typography.Title>
            <Typography.Text type="secondary">{title}</Typography.Text>
          </div>
          <div className="flex flex-col items-center gap-4 text-center mt-4">
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button type="primary" href="/" icon={<Home className="h-4 w-4" />} className="gap-2">
              العودة إلى الرئيسية
            </Button>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  )
}

import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/common/ModeToggle'

export function ErrorPage() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  const code = is404 ? '404' : 'خطأ'
  const title = is404 ? 'الصفحة غير موجودة' : 'حدث خطأ غير متوقع'
  const description = is404
    ? 'الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.'
    : 'عذرًا، حدث خطأ أثناء تحميل الصفحة. حاول تحديث الصفحة أو العودة إلى الرئيسية.'

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <ModeToggle className="absolute end-4 top-4" />
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AlertTriangle className="mb-2 h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">{code}</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              العودة إلى الرئيسية
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

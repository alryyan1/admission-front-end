import { Moon, Sun } from 'lucide-react'
import { Button } from 'antd'
import { useTheme } from '@/contexts/ThemeContext'

export function ModeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      type="text"
      shape="circle"
      className={className}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

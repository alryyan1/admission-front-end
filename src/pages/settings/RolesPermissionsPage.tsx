import { ConfigProvider, Card, Collapse, List, Typography, Tag, Alert } from 'antd'
import { useAntTheme } from '@/lib/antdTheme'
import { ROLE_LABEL } from '@/lib/roles'
import type { UserRole } from '@/types/auth'

const { Title, Text } = Typography

interface RoleInfo {
  role: UserRole
  summary: string
  capabilities: string[]
}

const ROLE_INFO: RoleInfo[] = [
  {
    role: 'admin',
    summary: 'صلاحية كاملة على كل ميزات النظام.',
    capabilities: [
      'إدارة المستخدمين وأدوارهم وتفعيل/تعطيل الحسابات',
      'إدارة إعدادات المنشأة والخدمات المرتبطة بفتح الملف والإقامة القصيرة',
      'إدارة الأطباء وأدوار الفريق الطبي وكتالوج العمليات والخدمات',
      'إدارة الطوابق والأجنحة والغرف والأسرة',
      'إدارة تكليف التمريض',
      'الوصول إلى الجلسات النشطة وسجل النشاط',
      'كل الصلاحيات المتاحة لبقية الأدوار (تنويم، عمليات، فواتير، علامات حيوية...)',
    ],
  },
  {
    role: 'doctor',
    summary: 'إدارة الجانب الطبي لحالات التنويم والعمليات الجراحية.',
    capabilities: [
      'عرض المرضى وحالات التنويم والأطباء والخدمات',
      'تسجيل خروج المريض (Discharge)',
      'إضافة أوامر طبية للمريض',
      'إضافة أو حذف خدمات مطلوبة للمريض',
      'إنشاء وإدارة العمليات الجراحية بالكامل: التحضير، البدء، الإكمال، الإلغاء، إدارة الفريق والمستلزمات',
    ],
  },
  {
    role: 'nurse',
    summary: 'المتابعة التمريضية للمرضى والمشاركة في العمليات.',
    capabilities: [
      'عرض المرضى وحالات التنويم',
      'تسجيل العلامات الحيوية',
      'تسجيل جرعات العلاج على أوامر الطبيب',
      'إضافة أو حذف خدمات مطلوبة للمريض',
      'المشاركة في تحضير العمليات وإدارة المستلزمات الجراحية',
    ],
  },
  {
    role: 'admission_clerk',
    summary: 'إدارة استقبال المرضى وحالات التنويم.',
    capabilities: [
      'البحث عن مرضى جواد واستيرادهم',
      'إضافة وتعديل بيانات المرضى',
      'إنشاء حالات تنويم جديدة',
      'إلغاء حالات تنويم',
    ],
  },
  {
    role: 'cashier',
    summary: 'إدارة الجوانب المالية لحالات التنويم.',
    capabilities: [
      'عرض حالات التنويم والفواتير',
      'تسجيل عربون/دفعات على حالة التنويم',
      'إنشاء الفواتير وتسجيل حالتها كمدفوعة',
    ],
  },
]

export function RolesPermissionsPage() {
  const antTheme = useAntTheme()

  return (
    <ConfigProvider direction="rtl" theme={antTheme}>
      <Title level={3} style={{ margin: '0 0 16px' }}>
        الأدوار والصلاحيات
      </Title>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="مرجع للاطلاع فقط"
        description="تعرض هذه الصفحة الصلاحيات المرتبطة بكل دور في النظام حسب الإعداد الحالي للخادم. لا يمكن تعديل هذه الصلاحيات من الواجهة؛ يمكنك إدارة أدوار المستخدمين أنفسهم من صفحة المستخدمون."
      />

      <Card>
        <Collapse
          defaultActiveKey={['admin']}
          items={ROLE_INFO.map(({ role, summary, capabilities }) => ({
            key: role,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={role === 'admin' ? 'gold' : 'default'}>{ROLE_LABEL[role]}</Tag>
                <Text type="secondary">{summary}</Text>
              </div>
            ),
            children: (
              <List
                size="small"
                dataSource={capabilities}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            ),
          }))}
        />
      </Card>
    </ConfigProvider>
  )
}

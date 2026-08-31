'use client'

import { ShieldCheck, Mail, UserCheck } from 'lucide-react'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'
import { Badge } from '@/components/ui/Badge'

interface AccountInfoGroupProps {
  email?: string
  role?: string
  status?: string
}

export default function AccountInfoGroup({
  email,
  role = 'candidate',
  status = 'active',
}: AccountInfoGroupProps) {
  const roleLabel = role === 'admin' ? 'Quản trị viên' : 'Ứng viên'
  const isStatusActive = status === 'active'

  return (
    <ProfileSection title="Thông tin tài khoản">
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-ink-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5 text-brand" />
            Email đăng nhập
          </dt>
          <dd className="text-ink font-medium">{email || 'Chưa cập nhật'}</dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-ink-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
            <UserCheck className="h-3.5 w-3.5 text-brand" />
            Vai trò hệ thống
          </dt>
          <dd>
            <Badge variant="secondary" className="font-medium">
              {roleLabel}
            </Badge>
          </dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-ink-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Trạng thái tài khoản
          </dt>
          <dd>
            <Badge
              variant={isStatusActive ? 'default' : 'destructive'}
              className="font-medium"
            >
              {isStatusActive ? 'Đang hoạt động' : 'Tạm khóa'}
            </Badge>
          </dd>
        </div>
      </dl>
    </ProfileSection>
  )
}

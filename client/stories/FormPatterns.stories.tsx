import type { Meta } from '@storybook/nextjs-vite'
import { FormSection, SearchInput } from '@/components/patterns/FormPatterns'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

const meta: Meta = {
  title: 'Patterns/Form',
  tags: ['autodocs'],
}

export default meta

export const FormSectionExample = () => (
  <div className="p-8 max-w-4xl">
    <FormSection title="Thông tin cá nhân" description="Cập nhật thông tin cá nhân của bạn">
      <div className="space-y-4">
        <div>
          <Label>Họ và tên</Label>
          <Input placeholder="Nguyễn Văn A" />
        </div>
        <div>
          <Label>Email</Label>
          <Input placeholder="email@example.com" />
        </div>
      </div>
    </FormSection>
  </div>
)

export const SearchInputExample = () => {
  const [value, setValue] = useState('')
  return (
    <div className="p-4">
      <SearchInput value={value} onChange={setValue} />
    </div>
  )
}

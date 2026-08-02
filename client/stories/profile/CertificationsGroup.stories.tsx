import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CertificationsGroup from '../../components/profile/CertificationsGroup'

const meta: Meta<typeof CertificationsGroup> = {
  title: 'Feature/Profile/CertificationsGroup',
  component: CertificationsGroup,
  tags: ['autodocs'],
  args: {
    data: { certifications: [], awards: [] },
    onSave: async () => {
      await new Promise(r => setTimeout(r, 1000))
    }
  },
}

export default meta
type Story = StoryObj<typeof CertificationsGroup>

export const Default: Story = {}

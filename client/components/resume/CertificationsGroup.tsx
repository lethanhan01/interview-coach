'use client'

import { useState } from 'react'
import { Box, Button, Tabs, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAward,
  IconCertificate,
  IconLanguage,
  IconPlus,
} from '@tabler/icons-react'
import ProfileSection from '@/components/profile/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'
import type { AwardEntry, CertificationEntry } from '@/types'
import AwardFormModal from './AwardFormModal'
import {
  AwardCardsGrid,
  CertificationCardsGrid,
} from './CertificationCardsGrid'
import CertificationFormModal from './CertificationFormModal'

export interface CertificationsGroupProps {
  data: {
    certifications: CertificationEntry[]
    awards: AwardEntry[]
  }
  onSave: (patch: Record<string, unknown>) => Promise<void>
}

function notify(title: string, message: string, color: 'success' | 'danger') {
  notifications.show({
    title,
    message,
    color,
    closeButtonProps: { 'aria-label': 'Đóng thông báo' },
  })
}

export default function CertificationsGroup({
  data,
  onSave,
}: Readonly<CertificationsGroupProps>) {
  const [activeTab, setActiveTab] = useState('professional')
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<CertificationEntry | null>(
    null
  )
  const [certModalKey, setCertModalKey] = useState(0)
  const [awardModalOpen, setAwardModalOpen] = useState(false)
  const [editingAward, setEditingAward] = useState<AwardEntry | null>(null)
  const [awardModalKey, setAwardModalKey] = useState(0)

  const professionalCerts = data.certifications.filter(
    (c) => c.type === 'professional'
  )
  const languageCerts = data.certifications.filter((c) => c.type === 'language')

  function openCertModal(cert: CertificationEntry | null) {
    setEditingCert(cert)
    setCertModalKey((k) => k + 1)
    setCertModalOpen(true)
  }

  function openAwardModal(award: AwardEntry | null) {
    setEditingAward(award)
    setAwardModalKey((k) => k + 1)
    setAwardModalOpen(true)
  }

  async function saveCertification(entry: CertificationEntry) {
    const exists = data.certifications.some((c) => c.id === entry.id)
    const nextCerts = exists
      ? data.certifications.map((c) => (c.id === entry.id ? entry : c))
      : [entry, ...data.certifications]
    await onSave({ certifications: nextCerts, awards: data.awards })
    notify(
      exists ? 'Đã cập nhật' : 'Đã thêm mới',
      'Thông tin chứng chỉ đã được lưu.',
      'success'
    )
  }

  async function saveAward(entry: AwardEntry) {
    const exists = data.awards.some((a) => a.id === entry.id)
    const nextAwards = exists
      ? data.awards.map((a) => (a.id === entry.id ? entry : a))
      : [entry, ...data.awards]
    await onSave({ certifications: data.certifications, awards: nextAwards })
    notify(
      exists ? 'Đã cập nhật' : 'Đã thêm mới',
      'Thông tin giải thưởng đã được lưu.',
      'success'
    )
  }

  function confirmDelete(
    title: string,
    label: string,
    onRun: () => Promise<void>
  ) {
    modals.openConfirmModal({
      title,
      children: (
        <Text size="sm">Bạn có chắc muốn xóa {label} khỏi hồ sơ không?</Text>
      ),
      labels: { confirm: 'Xóa', cancel: 'Hủy' },
      confirmProps: { color: 'danger' },
      onConfirm: async () => {
        try {
          await onRun()
          notify('Đã xóa', `Đã xóa ${label} khỏi hồ sơ.`, 'success')
        } catch (err) {
          notify(
            'Xóa thất bại',
            getErrorMessage(err, 'Không thể xóa mục này'),
            'danger'
          )
        }
      },
    })
  }

  function removeCert(cert: CertificationEntry) {
    confirmDelete('Xóa chứng chỉ', `chứng chỉ ${cert.name || 'này'}`, () =>
      onSave({
        certifications: data.certifications.filter((c) => c.id !== cert.id),
        awards: data.awards,
      })
    )
  }

  function removeAward(award: AwardEntry) {
    confirmDelete('Xóa giải thưởng', `giải thưởng ${award.name || 'này'}`, () =>
      onSave({
        certifications: data.certifications,
        awards: data.awards.filter((a) => a.id !== award.id),
      })
    )
  }

  return (
    <Box id="certifications">
      <ProfileSection
        title="Chứng chỉ & Giải thưởng"
        action={
          <Button
            type="button"
            variant="light"
            color="brand"
            size="xs"
            leftSection={<IconPlus size={14} stroke={1.5} aria-hidden="true" />}
            onClick={() =>
              activeTab === 'awards'
                ? openAwardModal(null)
                : openCertModal(null)
            }
          >
            {activeTab === 'awards' ? 'Thêm giải thưởng' : 'Thêm chứng chỉ'}
          </Button>
        }
      >
        <Tabs value={activeTab} onChange={(val) => val && setActiveTab(val)}>
          <Tabs.List>
            <Tabs.Tab
              value="professional"
              leftSection={
                <IconCertificate size={15} stroke={1.5} aria-hidden="true" />
              }
            >
              Chuyên môn ({professionalCerts.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="language"
              leftSection={
                <IconLanguage size={15} stroke={1.5} aria-hidden="true" />
              }
            >
              Ngoại ngữ ({languageCerts.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="awards"
              leftSection={
                <IconAward size={15} stroke={1.5} aria-hidden="true" />
              }
            >
              Giải thưởng ({data.awards.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="professional" pt="md">
            <CertificationCardsGrid
              items={professionalCerts}
              emptyText="Chưa thêm chứng chỉ chuyên môn"
              onEdit={openCertModal}
              onDelete={removeCert}
            />
          </Tabs.Panel>

          <Tabs.Panel value="language" pt="md">
            <CertificationCardsGrid
              items={languageCerts}
              emptyText="Chưa thêm chứng chỉ ngoại ngữ"
              onEdit={openCertModal}
              onDelete={removeCert}
            />
          </Tabs.Panel>

          <Tabs.Panel value="awards" pt="md">
            <AwardCardsGrid
              items={data.awards}
              onEdit={openAwardModal}
              onDelete={removeAward}
            />
          </Tabs.Panel>
        </Tabs>
      </ProfileSection>

      <CertificationFormModal
        key={`cert-${certModalKey}`}
        opened={certModalOpen}
        initialEntry={editingCert}
        defaultType={activeTab === 'language' ? 'language' : 'professional'}
        onClose={() => setCertModalOpen(false)}
        onSubmit={saveCertification}
      />

      <AwardFormModal
        key={`award-${awardModalKey}`}
        opened={awardModalOpen}
        initialEntry={editingAward}
        onClose={() => setAwardModalOpen(false)}
        onSubmit={saveAward}
      />
    </Box>
  )
}

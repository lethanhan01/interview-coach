'use client'

import { useState } from 'react'
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export interface OnetSfiaResetModalProps {
  opened: boolean
  onClose: () => void
  occupationTitle: string
  socCode: string
  onConfirmReset: () => Promise<void>
  isResetting: boolean
}

export function OnetSfiaResetModal({
  opened,
  onClose,
  occupationTitle,
  socCode,
  onConfirmReset,
  isResetting,
}: Readonly<OnetSfiaResetModalProps>) {
  const [resetError, setResetError] = useState<string | null>(null)

  const handleClose = () => {
    if (isResetting) return
    setResetError(null)
    onClose()
  }

  const handleConfirm = async () => {
    setResetError(null)
    try {
      await onConfirmReset()
    } catch (err) {
      setResetError(
        err instanceof Error
          ? err.message
          : 'Không thể khôi phục mẫu ánh xạ SFIA'
      )
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      closeOnClickOutside={!isResetting}
      closeOnEscape={!isResetting}
      withCloseButton={!isResetting}
      closeButtonProps={{ 'aria-label': 'Đóng cửa sổ khôi phục mẫu' }}
      title="Khôi phục Mẫu Ánh xạ SFIA Mặc định"
      centered
      size="md"
    >
      <Stack gap="sm">
        {resetError ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={16} stroke={1.5} />}
            title="Lỗi khôi phục"
          >
            {resetError}
          </Alert>
        ) : null}

        <Text size="sm">
          Thao tác này sẽ xóa toàn bộ ánh xạ{' '}
          <Text span fw={700}>
            USER_DEFINED
          </Text>{' '}
          do quản trị viên tự thêm trên nghề{' '}
          <Text span fw={700}>
            {occupationTitle} ({socCode})
          </Text>
          , đồng thời giữ nguyên các ánh xạ chuẩn{' '}
          <Text span fw={700}>
            ONET_CROSSWALK
          </Text>{' '}
          và{' '}
          <Text span fw={700}>
            EXPERT_CURATED
          </Text>
          .
        </Text>

        <Group justify="flex-end" pt="xs">
          <Button
            variant="default"
            disabled={isResetting}
            onClick={handleClose}
          >
            Hủy
          </Button>
          <Button color="danger" loading={isResetting} onClick={handleConfirm}>
            Xác nhận khôi phục
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

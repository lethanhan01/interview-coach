'use client'

import { Button, Group, Modal, Stack, Text } from '@mantine/core'

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
  return (
    <Modal
      opened={opened}
      onClose={isResetting ? () => undefined : onClose}
      closeOnClickOutside={!isResetting}
      closeButtonProps={{ 'aria-label': 'Đóng cửa sổ khôi phục mẫu' }}
      title="Khôi phục Mẫu Ánh xạ SFIA Mặc định"
      centered
      size="md"
    >
      <Stack gap="sm">
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
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            color="danger"
            loading={isResetting}
            onClick={onConfirmReset}
          >
            Xác nhận khôi phục
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

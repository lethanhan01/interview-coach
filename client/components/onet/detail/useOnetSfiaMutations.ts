'use client'

import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/keys'
import { onetAdminService } from '@/services/onet-admin.service'
import type {
  CreateOnetSfiaMappingPayload,
  UpdateOnetSfiaMappingPayload,
} from '@/types'

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback

export function useOnetSfiaMutations(socCode: string) {
  const queryClient = useQueryClient()

  const invalidateOnetAdmin = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onetAdmin.all,
      predicate: (query) =>
        !(
          query.queryKey[0] === 'onet-admin' &&
          query.queryKey[1] === 'sfia-library'
        ),
    })
  }

  const updateMappingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateOnetSfiaMappingPayload
    }) => onetAdminService.updateSfiaMapping(socCode, id, payload),
    onSuccess: () => {
      invalidateOnetAdmin()
      notifications.show({
        color: 'success',
        title: 'Đã cập nhật ánh xạ SFIA',
        message: 'Thay đổi ánh xạ kỹ năng đã được lưu thành công.',
      })
    },
    onError: (err) => {
      notifications.show({
        color: 'danger',
        title: 'Không thể cập nhật ánh xạ',
        message: getErrorMessage(err, 'Đã xảy ra lỗi khi lưu ánh xạ SFIA.'),
      })
    },
  })

  const createMappingMutation = useMutation({
    mutationFn: (payload: CreateOnetSfiaMappingPayload) =>
      onetAdminService.createSfiaMapping(socCode, payload),
    onSuccess: (created) => {
      invalidateOnetAdmin()
      notifications.show({
        color: 'success',
        title: 'Đã thêm ánh xạ SFIA',
        message: `Đã bổ sung kỹ năng ${created.skillCode} vào nghề này.`,
      })
    },
    onError: (err) => {
      notifications.show({
        color: 'danger',
        title: 'Không thể thêm ánh xạ',
        message: getErrorMessage(err, 'Đã xảy ra lỗi khi thêm ánh xạ SFIA.'),
      })
    },
  })

  const deleteMappingMutation = useMutation({
    mutationFn: (id: string) => onetAdminService.deleteSfiaMapping(socCode, id),
    onSuccess: () => {
      invalidateOnetAdmin()
      notifications.show({
        color: 'success',
        title: 'Đã xóa ánh xạ SFIA',
        message: 'Ánh xạ kỹ năng đã được gỡ khỏi nghề này.',
      })
    },
    onError: (err) => {
      notifications.show({
        color: 'danger',
        title: 'Không thể xóa ánh xạ',
        message: getErrorMessage(err, 'Đã xảy ra lỗi khi xóa ánh xạ SFIA.'),
      })
    },
  })

  const resetMappingsMutation = useMutation({
    mutationFn: () => onetAdminService.resetSfiaMappings(socCode),
    onSuccess: () => {
      invalidateOnetAdmin()
      notifications.show({
        color: 'success',
        title: 'Đã khôi phục mẫu mặc định',
        message: 'Toàn bộ ánh xạ tự định nghĩa đã được đưa về cấu hình gốc.',
      })
    },
    onError: (err) => {
      notifications.show({
        color: 'danger',
        title: 'Không thể khôi phục mẫu',
        message: getErrorMessage(
          err,
          'Đã xảy ra lỗi khi khôi phục ánh xạ SFIA.'
        ),
      })
    },
  })

  const isMutating =
    createMappingMutation.isPending ||
    updateMappingMutation.isPending ||
    deleteMappingMutation.isPending ||
    resetMappingsMutation.isPending

  return {
    createMappingMutation,
    updateMappingMutation,
    deleteMappingMutation,
    resetMappingsMutation,
    isMutating,
  }
}

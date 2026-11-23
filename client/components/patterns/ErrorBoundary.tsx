'use client'

import { Component, type ReactNode } from 'react'
import { Alert, Button, Center, Group, Stack, Text } from '@mantine/core'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  handleReset = () => {
    this.setState({ hasError: false })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Center mih={240} p="md">
          <Alert
            color="danger"
            variant="light"
            radius="md"
            title="Đã xảy ra lỗi hiển thị"
            icon={
              <IconAlertTriangle size={20} stroke={1.5} aria-hidden="true" />
            }
            maw={440}
            w="100%"
          >
            <Stack gap="sm">
              <Text size="sm">
                Đã xảy ra sự cố ngoài ý muốn. Vui lòng thử lại hoặc tải lại
                trang.
              </Text>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  color="danger"
                  leftSection={
                    <IconRefresh size={14} stroke={1.5} aria-hidden="true" />
                  }
                  onClick={this.handleReset}
                >
                  Thử lại
                </Button>
              </Group>
            </Stack>
          </Alert>
        </Center>
      )
    }

    return this.props.children
  }
}

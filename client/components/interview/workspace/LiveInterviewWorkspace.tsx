'use client'

import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconKeyboard,
  IconMicrophone,
  IconPlayerSkipForward,
} from '@tabler/icons-react'
import QuestionCard from '@/components/interview/QuestionCard'
import TextAnswerInput from '@/components/interview/TextAnswerInput'
import VoiceRecorder from '@/components/interview/VoiceRecorder'
import {
  DIRECTIONAL_VIEW_TRANSITION_ENTER,
  DIRECTIONAL_VIEW_TRANSITION_EXIT,
  SafeViewTransition,
} from '@/components/common/SafeViewTransition'
import type { ConnectionState } from '@/hooks/useSessionEvents'
import type { Question, SessionStatusAction, VoiceMetrics } from '@/types'
import SessionHeaderBar from './SessionHeaderBar'
import classes from './LiveInterviewWorkspace.module.css'

export interface LiveInterviewWorkspaceProps {
  sessionId: string
  sessionLanguage: 'vi' | 'en'
  questions: Question[]
  currentIndex: number
  remainingSeconds: number
  isTimerActive: boolean
  questionsReady: boolean
  isCompleting: boolean
  turnSubmitting: boolean
  statusAction: SessionStatusAction | null
  actionError: string | null
  connectionState: ConnectionState
  answerMode: 'text' | 'voice'
  draftAnswer: string
  isVoiceBusy: boolean
  onRemainingChange: (seconds: number) => void
  onExpire: () => void
  onPause: () => void
  onEarlyFinish: () => void
  onCancel: () => void
  onReconnect: () => void
  onAnswerModeChange: (mode: 'text' | 'voice') => void
  onDraftChange: (draft: string) => void
  onVoiceBusyChange: (busy: boolean) => void
  onSubmitText: (text: string) => Promise<void>
  onSubmitVoice: (
    transcript: string,
    durationSeconds: number,
    metrics?: VoiceMetrics
  ) => Promise<void>
  onSkip: () => void
}

export default function LiveInterviewWorkspace({
  sessionId,
  sessionLanguage,
  questions,
  currentIndex,
  remainingSeconds,
  isTimerActive,
  questionsReady,
  isCompleting,
  turnSubmitting,
  statusAction,
  actionError,
  connectionState,
  answerMode,
  draftAnswer,
  isVoiceBusy,
  onRemainingChange,
  onExpire,
  onPause,
  onEarlyFinish,
  onCancel,
  onReconnect,
  onAnswerModeChange,
  onDraftChange,
  onVoiceBusyChange,
  onSubmitText,
  onSubmitVoice,
  onSkip,
}: Readonly<LiveInterviewWorkspaceProps>) {
  const current = questions[currentIndex]

  return (
    <Container size="md" px={0} className={classes.workspace}>
      <VisuallyHidden>
        <Title order={1}>Phòng phỏng vấn trực tiếp</Title>
      </VisuallyHidden>

      <Stack gap="md">
        <SessionHeaderBar
          remainingSeconds={remainingSeconds}
          isTimerActive={isTimerActive}
          questionsReady={questionsReady}
          isCompleting={isCompleting}
          isVoiceBusy={isVoiceBusy}
          statusAction={statusAction}
          connectionState={connectionState}
          onRemainingChange={onRemainingChange}
          onExpire={onExpire}
          onPause={onPause}
          onEarlyFinish={onEarlyFinish}
          onCancel={onCancel}
          onReconnect={onReconnect}
        />

        {actionError ? (
          <Alert
            color="danger"
            variant="light"
            role="alert"
            icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
          >
            {actionError}
          </Alert>
        ) : null}

        <Group gap="xs" wrap="wrap">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentIndex
            const isPast = idx < currentIndex
            return (
              <Badge
                key={`q-step-${idx}`}
                className={classes.questionBadge}
                variant={isCurrent ? 'filled' : isPast ? 'light' : 'outline'}
                color={isCurrent ? 'brand' : isPast ? 'success' : 'neutral'}
                size="sm"
              >
                Câu {idx + 1}
              </Badge>
            )
          })}
        </Group>

        {current ? (
          <SafeViewTransition
            key={current.id}
            default="none"
            enter={DIRECTIONAL_VIEW_TRANSITION_ENTER}
            exit={DIRECTIONAL_VIEW_TRANSITION_EXIT}
          >
            <Box>
              <QuestionCard
                questionText={current.content}
                orderIndex={currentIndex}
                totalQuestions={questions.length}
                skillCode={current.skillCode}
                skillName={current.skillName}
                language={sessionLanguage}
              />
            </Box>
          </SafeViewTransition>
        ) : null}

        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Tabs
              value={answerMode}
              onChange={(val) => onAnswerModeChange(val as 'text' | 'voice')}
              keepMounted={false}
            >
              <Tabs.List>
                <Tabs.Tab
                  value="text"
                  disabled={isVoiceBusy || turnSubmitting || isCompleting}
                  leftSection={
                    <IconKeyboard size={16} stroke={1.5} aria-hidden="true" />
                  }
                >
                  Văn bản
                </Tabs.Tab>
                <Tabs.Tab
                  value="voice"
                  disabled={isVoiceBusy || turnSubmitting || isCompleting}
                  leftSection={
                    <IconMicrophone size={16} stroke={1.5} aria-hidden="true" />
                  }
                >
                  Giọng nói
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="text" pt="md">
                {current ? (
                  <TextAnswerInput
                    key={current.id}
                    initialValue={draftAnswer}
                    onTextChange={onDraftChange}
                    onSubmit={onSubmitText}
                    disabled={turnSubmitting || isCompleting}
                  />
                ) : null}
              </Tabs.Panel>

              <Tabs.Panel value="voice" pt="md">
                {current ? (
                  <VoiceRecorder
                    key={current.id}
                    sessionId={sessionId}
                    language={sessionLanguage}
                    initialDraft={draftAnswer}
                    onDraftChange={onDraftChange}
                    onBusyChange={onVoiceBusyChange}
                    onSubmit={onSubmitVoice}
                    disabled={turnSubmitting || isCompleting}
                  />
                ) : null}
              </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onSkip}
                disabled={
                  turnSubmitting || isCompleting || isVoiceBusy || !current
                }
                loading={turnSubmitting}
                leftSection={
                  <IconPlayerSkipForward
                    size={16}
                    stroke={1.5}
                    aria-hidden="true"
                  />
                }
              >
                Bỏ qua
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

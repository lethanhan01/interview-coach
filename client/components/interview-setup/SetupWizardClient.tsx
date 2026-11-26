'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Box, Button, Container, Stack, Stepper } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import {
  DIRECTIONAL_VIEW_TRANSITION_ENTER,
  DIRECTIONAL_VIEW_TRANSITION_EXIT,
  SafeViewTransition,
  startTypedTransition,
} from '@/components/common/SafeViewTransition'
import {
  mapJdLevelToSfia,
  normalizeJdLevel,
} from '@/lib/interview-option-helpers'
import { EMPTY_JD } from '@/lib/setup-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import { prepQueries } from '@/queries/prep.queries'
import { sessionQueries } from '@/queries/session.queries'
import type {
  ContextPack,
  InterviewDuration,
  JdFormData,
  SavedJobDescription,
  SessionType,
} from '@/types'
import {
  hasJdContent,
  hydrateSavedJobDescriptionLevels,
  savedJobDescriptionToForm,
} from './setup-mappers'
import SetupStepPanels, {
  SetupWizardSkeleton,
  type SetupStep,
} from './SetupStepPanels'
import { useSetupDraft } from './useSetupDraft'
import { useSetupSessionSubmit } from './useSetupSessionSubmit'

export default function SetupWizardClient() {
  const searchParams = useSearchParams()
  const {
    jd: draftJd,
    formVersion,
    updateJd,
    replaceJd,
    clearDraft,
  } = useSetupDraft()
  const [userStep, setUserStep] = useState<SetupStep | null>(null)
  const [hasCustomJd, setHasCustomJd] = useState(false)
  const [selectedSavedId, setSelectedSavedId] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [duration, setDuration] = useState<InterviewDuration>(30)

  const jdIdParam = searchParams.get('jdId')
  const isNewParam = searchParams.get('new') === '1'
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const jdLevels = useMemo(
    () => catalogQuery.data?.jdLevels ?? [],
    [catalogQuery.data]
  )

  const savedJdsQuery = useQuery(prepQueries.savedJds())
  const needsLevelHydration =
    savedJdsQuery.isSuccess &&
    catalogQuery.isSuccess &&
    savedJdsQuery.data.some((item) => !normalizeJdLevel(item.level, jdLevels))
  const sessionsQuery = useQuery({
    ...sessionQueries.list(),
    enabled: needsLevelHydration,
  })

  const savedJobDescriptions = useMemo(() => {
    const items = savedJdsQuery.data ?? []
    if (!needsLevelHydration || !sessionsQuery.data) return items
    return hydrateSavedJobDescriptionLevels(items, sessionsQuery.data, jdLevels)
  }, [jdLevels, needsLevelHydration, savedJdsQuery.data, sessionsQuery.data])

  const prefilledFromParam = useMemo(() => {
    if (!jdIdParam) return null
    const match = savedJobDescriptions.find((item) => item.id === jdIdParam)
    if (!match) return null
    return {
      id: match.id,
      form: savedJobDescriptionToForm(
        match,
        jdLevels,
        sessionsQuery.data ?? []
      ),
    }
  }, [jdIdParam, jdLevels, savedJobDescriptions, sessionsQuery.data])

  const isLoadingInitial =
    savedJdsQuery.isPending || (needsLevelHydration && sessionsQuery.isPending)

  const derivedStep: SetupStep =
    savedJdsQuery.isError ||
    Boolean(jdIdParam) ||
    isNewParam ||
    savedJobDescriptions.length === 0
      ? 1
      : 0

  const step = userStep ?? derivedStep
  const rawActiveJd: JdFormData =
    !hasCustomJd && prefilledFromParam ? prefilledFromParam.form : draftJd

  const activeJd: JdFormData = useMemo(() => {
    if (
      rawActiveJd.targetSfiaLevel !== undefined ||
      !rawActiveJd.level ||
      !catalogQuery.data
    ) {
      return rawActiveJd
    }
    const mapped = mapJdLevelToSfia(
      rawActiveJd.level,
      catalogQuery.data.jdLevels
    )
    return mapped !== undefined
      ? { ...rawActiveJd, targetSfiaLevel: mapped }
      : rawActiveJd
  }, [catalogQuery.data, rawActiveJd])

  const activeSelectedId =
    selectedSavedId || (!hasCustomJd ? (prefilledFromParam?.id ?? '') : '')
  const jdFormKey = `${formVersion}-${!hasCustomJd && prefilledFromParam ? prefilledFromParam.id : 'draft'}`

  const { error, submitting, canSubmit, submit } = useSetupSessionSubmit({
    activeJd,
    sessionType,
    contextPack,
    duration,
    catalog: catalogQuery.data,
    onSubmitted: () => {
      setHasCustomJd(true)
      clearDraft()
    },
  })

  function goToStep(next: SetupStep) {
    if (next === step) return
    startTypedTransition(next > step ? 'nav-forward' : 'nav-back', () =>
      setUserStep(next)
    )
  }

  function handlePickerSelect(item: SavedJobDescription) {
    setHasCustomJd(true)
    replaceJd(
      savedJobDescriptionToForm(item, jdLevels, sessionsQuery.data ?? [])
    )
    setSelectedSavedId(item.id)
    goToStep(1)
  }

  function handlePickerNew() {
    setHasCustomJd(true)
    replaceJd(EMPTY_JD)
    setSelectedSavedId('')
    goToStep(1)
  }

  if (isLoadingInitial) return <SetupWizardSkeleton />

  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        {step >= 1 ? (
          <>
            <Box>
              <Button
                component={Link}
                href="/jd-library"
                transitionTypes={['nav-back']}
                variant="subtle"
                color="neutral"
                size="xs"
                leftSection={
                  <IconArrowLeft size={15} stroke={1.5} aria-hidden="true" />
                }
              >
                Thư viện JD
              </Button>
            </Box>
            <Stepper
              active={step - 1}
              color="brand"
              allowNextStepsSelect={false}
              onStepClick={(index) => goToStep((index + 1) as SetupStep)}
            >
              <Stepper.Step label="Job Description" />
              <Stepper.Step label="Cấu hình" />
              <Stepper.Step label="Xác nhận" />
            </Stepper>
          </>
        ) : null}

        <SafeViewTransition
          key={step}
          default="none"
          enter={DIRECTIONAL_VIEW_TRANSITION_ENTER}
          exit={DIRECTIONAL_VIEW_TRANSITION_EXIT}
        >
          <Box>
            <SetupStepPanels
              step={step}
              jd={activeJd}
              jdFormKey={jdFormKey}
              jdHasContent={hasJdContent(activeJd)}
              savedJobDescriptions={savedJobDescriptions}
              selectedSavedId={activeSelectedId}
              sessionType={sessionType}
              contextPack={contextPack}
              duration={duration}
              error={error}
              submitting={submitting}
              submitDisabled={!canSubmit}
              onSelectSaved={handlePickerSelect}
              onNewFromPicker={handlePickerNew}
              onJdChange={(next) => {
                setHasCustomJd(true)
                updateJd(next)
                setSelectedSavedId('')
              }}
              onResetDraft={() => {
                setHasCustomJd(true)
                clearDraft()
                setSelectedSavedId('')
              }}
              onSetSessionType={setSessionType}
              onSetContextPack={setContextPack}
              onSetDuration={setDuration}
              onGoToStep={goToStep}
              onSubmit={submit}
            />
          </Box>
        </SafeViewTransition>
      </Stack>
    </Container>
  )
}

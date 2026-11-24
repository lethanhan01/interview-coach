import { queryOptions } from '@tanstack/react-query'
import { sessionService } from '@/services/session.service'
import { queryKeys } from './keys'

export const sessionQueries = {
  all: () => queryKeys.sessions.all,
  list: () =>
    queryOptions({
      queryKey: queryKeys.sessions.list(),
      queryFn: ({ signal }) => sessionService.getSessions(signal),
      staleTime: 5_000,
    }),
  detail: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.detail(sessionId),
      queryFn: ({ signal }) => sessionService.getSession(sessionId, signal),
    }),
  status: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.status(sessionId),
      queryFn: ({ signal }) =>
        sessionService.getSessionStatus(sessionId, signal),
      staleTime: 5_000,
    }),
  questions: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.questions(sessionId),
      queryFn: ({ signal }) => sessionService.getQuestions(sessionId, signal),
    }),
  feedbackProgress: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.feedbackProgress(sessionId),
      queryFn: ({ signal }) =>
        sessionService.getFeedbackProgress(sessionId, signal),
      staleTime: 5_000,
    }),
  report: (sessionId: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.report(sessionId),
      queryFn: ({ signal }) => sessionService.getReport(sessionId, signal),
      staleTime: 60_000,
    }),
}

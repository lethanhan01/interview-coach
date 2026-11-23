import { apiClient, getApiBaseUrl } from '@/lib/api-client'
import type {
  CreateSessionPayload,
  CreateSessionResponse,
  FeedbackProgress,
  QuestionsResponse,
  Report,
  Session,
  SessionsListResponse,
  SessionStatusResponse,
  SubmitAnswerPayload,
  TurnResponse,
  UpdateSessionStatusPayload,
} from '@/types'

export const sessionService = {
  /**
   * Tạo phiên phỏng vấn mới và kích hoạt tạo bộ câu hỏi
   */
  async createSession(
    payload: CreateSessionPayload
  ): Promise<CreateSessionResponse> {
    return apiClient.post<CreateSessionResponse>('/sessions', payload)
  },

  /**
   * Lấy danh sách các phiên phỏng vấn của người dùng
   */
  async getSessions(signal?: AbortSignal): Promise<Session[]> {
    const res = await apiClient.get<SessionsListResponse>('/sessions', {
      signal,
    })
    return res.sessions ?? []
  },

  /**
   * Lấy chi tiết một phiên phỏng vấn theo ID
   */
  async getSession(sessionId: string, signal?: AbortSignal): Promise<Session> {
    return apiClient.get<Session>(`/sessions/${sessionId}`, { signal })
  },

  /**
   * Lấy trạng thái sinh câu hỏi của phiên
   */
  async getSessionStatus(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<SessionStatusResponse> {
    return apiClient.get<SessionStatusResponse>(
      `/sessions/${sessionId}/status`,
      { signal }
    )
  },

  /**
   * Lấy danh sách câu hỏi của phiên
   */
  async getQuestions(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<QuestionsResponse> {
    return apiClient.get<QuestionsResponse>(
      `/sessions/${sessionId}/questions`,
      { signal }
    )
  },

  /**
   * Lấy tiến độ đánh giá feedback bất đồng bộ
   */
  async getFeedbackProgress(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<FeedbackProgress> {
    return apiClient.get<FeedbackProgress>(
      `/sessions/${sessionId}/feedback-progress`,
      { signal }
    )
  },

  /**
   * Lấy báo cáo phỏng vấn đã hoàn tất
   */
  async getReport(sessionId: string, signal?: AbortSignal): Promise<Report> {
    return apiClient.get<Report>(`/sessions/${sessionId}/report`, { signal })
  },

  /**
   * Cập nhật trạng thái phiên phỏng vấn (pause, resume, complete, cancel)
   */
  async updateStatus(
    sessionId: string,
    payload: UpdateSessionStatusPayload
  ): Promise<Session> {
    return apiClient.patch<Session>(`/sessions/${sessionId}/status`, payload)
  },

  /**
   * Gửi câu trả lời dạng văn bản hoặc giọng nói
   */
  async submitTurn(
    sessionId: string,
    payload: SubmitAnswerPayload
  ): Promise<TurnResponse> {
    return apiClient.post<TurnResponse>(`/sessions/${sessionId}/turns`, payload)
  },

  /**
   * Khởi tạo kết nối SSE nhận sự kiện realtime từ phiên phỏng vấn
   * Sử dụng withCredentials để gửi kèm cookie phiên
   */
  createEventSource(sessionId: string): EventSource {
    const baseUrl = getApiBaseUrl()
    return new EventSource(`${baseUrl}/sessions/${sessionId}/events`, {
      withCredentials: true,
    })
  },
}

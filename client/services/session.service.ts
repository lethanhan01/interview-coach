import { apiClient, getApiBaseUrl } from '@/lib/api-client'
import type {
  AudioUploadResult,
  CreateSessionPayload,
  FeedbackProgress,
  QuestionsResponse,
  Report,
  Session,
  SessionStatus,
  SubmitAnswerPayload,
  TurnResponse,
  UpdateSessionStatusPayload,
} from '@/lib/types'

export const sessionService = {
  /**
   * Tạo phiên phỏng vấn mới và kích hoạt tạo bộ câu hỏi
   */
  async createSession(payload: CreateSessionPayload): Promise<{ id: string }> {
    return apiClient.post<{ id: string }>('/sessions', payload)
  },

  /**
   * Lấy danh sách các phiên phỏng vấn của người dùng
   */
  async getSessions(): Promise<Session[]> {
    const res = await apiClient.get<{ sessions: Session[] }>('/sessions')
    return res.sessions ?? []
  },

  /**
   * Lấy chi tiết một phiên phỏng vấn theo ID
   */
  async getSession(sessionId: string): Promise<Session> {
    return apiClient.get<Session>(`/sessions/${sessionId}`)
  },

  /**
   * Lấy trạng thái sinh câu hỏi của phiên
   */
  async getSessionStatus(
    sessionId: string
  ): Promise<{ status: SessionStatus; numQuestions: number }> {
    return apiClient.get<{ status: SessionStatus; numQuestions: number }>(
      `/sessions/${sessionId}/status`
    )
  },

  /**
   * Lấy danh sách câu hỏi của phiên
   */
  async getQuestions(sessionId: string): Promise<QuestionsResponse> {
    return apiClient.get<QuestionsResponse>(`/sessions/${sessionId}/questions`)
  },

  /**
   * Lấy tiến độ đánh giá feedback bất đồng bộ
   */
  async getFeedbackProgress(sessionId: string): Promise<FeedbackProgress> {
    return apiClient.get<FeedbackProgress>(
      `/sessions/${sessionId}/feedback-progress`
    )
  },

  /**
   * Lấy báo cáo phỏng vấn đã hoàn tất
   */
  async getReport(sessionId: string): Promise<Report> {
    return apiClient.get<Report>(`/sessions/${sessionId}/report`)
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
    return apiClient.post<TurnResponse>(
      `/sessions/${sessionId}/turns`,
      payload
    )
  },

  /**
   * Upload file ghi âm audio cho câu trả lời dạng voice
   */
  async uploadAudio(sessionId: string, blob: Blob): Promise<AudioUploadResult> {
    let ext = 'webm'
    if (blob.type.includes('mp4')) {
      ext = 'mp4'
    } else if (blob.type.includes('wav')) {
      ext = 'wav'
    }
    const filename = `audio-${crypto.randomUUID()}.${ext}`
    const formData = new FormData()
    formData.append('file', blob, filename)
    return apiClient.postForm<AudioUploadResult>(
      `/sessions/${sessionId}/turns/audio`,
      formData
    )
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

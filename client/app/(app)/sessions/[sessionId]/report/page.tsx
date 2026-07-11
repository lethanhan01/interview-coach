"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient, getAccessToken } from "@/lib/api-client";
import type {
  FeedbackProgress,
  Report,
  RubricConfig,
  Session,
} from "@/lib/types";
import AnnotatedTranscript from "@/components/report/AnnotatedTranscript";
import CompetencyScoreChart from "@/components/report/CompetencyScoreChart";
import SessionMetadataCard from "@/components/report/SessionMetadataCard";
import ScoringMethodCard from "@/components/report/ScoringMethodCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const REPORT_POLL_INTERVAL_MS = 5000;
const PROGRESS_POLL_INTERVAL_MS = 2000;
const GOOD_ANSWER_THRESHOLD = 70;
const WEAK_ANSWER_THRESHOLD = 40;

type SummaryAnswerItem = {
  label: string;
  score?: number;
  takeaway?: string;
};

type OverviewSummary = {
  overview: string;
  goodAnswers: SummaryAnswerItem[];
  weakAnswers: SummaryAnswerItem[];
  improvementDirections: string[];
};

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

function buildOverviewSummary(report: Report): OverviewSummary {
  const overview =
    typeof report.executiveSummary?.summary === "string" &&
    report.executiveSummary.summary.trim() !== ""
      ? report.executiveSummary.summary
      : "Báo cáo đã được tổng hợp từ các câu trả lời có đủ dữ liệu chấm điểm.";

  const scoredAnswers = (report.transcript ?? []).flatMap((item) => {
    if (item.skipped || item.isFallback || item.overallScore == null) {
      return [];
    }
    return [
      {
        label: `Câu ${item.orderIndex}`,
        score: item.overallScore,
        takeaway: item.keyTakeaway?.trim() || undefined,
      },
    ];
  });

  const goodAnswers = scoredAnswers.filter(
    (item) => item.score >= GOOD_ANSWER_THRESHOLD,
  );
  const weakAnswers = scoredAnswers.filter(
    (item) => item.score < WEAK_ANSWER_THRESHOLD,
  );
  const actionPlanItems = toStringList(report.actionPlan?.items);
  const improvementDirections =
    actionPlanItems.length > 0
      ? actionPlanItems
      : Array.from(
          new Set(
            weakAnswers.flatMap((item) =>
              item.takeaway ? [item.takeaway] : [],
            ),
          ),
        ).slice(0, 3);

  return {
    overview,
    goodAnswers,
    weakAnswers,
    improvementDirections,
  };
}

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rubricConfig, setRubricConfig] = useState<RubricConfig | null>(null);
  const [progress, setProgress] = useState<FeedbackProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportLoadedRef = useRef(false);

  const applyProgress = useCallback((next: FeedbackProgress) => {
    setProgress((prev) => {
      if (!prev) return next;
      const feedbackCompleted = Math.max(
        prev.feedbackCompleted,
        next.feedbackCompleted,
      );
      const feedbackRequired = Math.max(
        prev.feedbackRequired,
        next.feedbackRequired,
      );
      return {
        ...next,
        answeredQuestions: Math.max(
          prev.answeredQuestions,
          next.answeredQuestions,
        ),
        skippedQuestions: Math.max(
          prev.skippedQuestions,
          next.skippedQuestions,
        ),
        feedbackRequired,
        feedbackCompleted,
        feedbackPending: Math.max(0, feedbackRequired - feedbackCompleted),
        reportReady: prev.reportReady || next.reportReady,
      };
    });
  }, []);

  const progressPercent = useMemo(() => {
    if (!progress) return 0;
    if (progress.feedbackRequired === 0) return 100;
    return Math.min(
      100,
      Math.round(
        (progress.feedbackCompleted / progress.feedbackRequired) * 100,
      ),
    );
  }, [progress]);

  useEffect(() => {
    let canceled = false;
    let reportTimer: ReturnType<typeof setTimeout> | undefined;
    let progressTimer: ReturnType<typeof setTimeout> | undefined;
    let eventSource: EventSource | undefined;

    const sessionPromise = apiClient
      .get<Session>(`/sessions/${sessionId}`)
      .then(async (data) => {
        if (!canceled) setSession(data);
        try {
          const rubric = await apiClient.get<RubricConfig>(
            `/rubrics/${data.contextPackId}?sessionType=${data.sessionType}`,
          );
          if (!canceled) setRubricConfig(rubric);
        } catch {
          if (!canceled) setRubricConfig(null);
        }
      })
      .catch(() => {});

    async function fetchReport() {
      try {
        const data = await apiClient.get<Report>(
          `/sessions/${sessionId}/report`,
        );
        if (canceled) return;
        await sessionPromise;
        reportLoadedRef.current = true;
        setReport(data);
        setLoading(false);
        setError(null);
        if (reportTimer) clearTimeout(reportTimer);
        if (progressTimer) clearTimeout(progressTimer);
      } catch (err: unknown) {
        if (canceled) return;
        if (err instanceof Error && err.message.includes("REPORT_NOT_READY")) {
          reportTimer = setTimeout(fetchReport, REPORT_POLL_INTERVAL_MS);
        } else {
          setError(
            err instanceof Error ? err.message : "Không thể tải báo cáo",
          );
          setLoading(false);
        }
      }
    }

    async function fetchProgress() {
      try {
        const data = await apiClient.get<FeedbackProgress>(
          `/sessions/${sessionId}/feedback-progress`,
        );
        if (canceled || reportLoadedRef.current) return;
        applyProgress(data);
        if (data.reportReady) {
          void fetchReport();
          return;
        }
      } catch {
        // Progress is best-effort; report polling/SSE still handles readiness.
      } finally {
        if (!canceled && !reportLoadedRef.current) {
          progressTimer = setTimeout(fetchProgress, PROGRESS_POLL_INTERVAL_MS);
        }
      }
    }

    async function subscribeToProgress() {
      const accessToken = await getAccessToken();
      if (canceled || !accessToken) return;
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
      eventSource = new EventSource(
        `${apiBase}/sessions/${sessionId}/events?token=${accessToken}`,
      );
      eventSource.addEventListener("session.feedback_progress", (event) => {
        const data = JSON.parse(
          (event as MessageEvent).data,
        ) as FeedbackProgress;
        applyProgress(data);
        if (data.reportReady) void fetchReport();
      });
      eventSource.addEventListener("report.ready", () => {
        void fetchReport();
      });
      eventSource.onerror = () => eventSource?.close();
    }

    fetchReport();
    fetchProgress();
    void subscribeToProgress();

    return () => {
      canceled = true;
      if (reportTimer) clearTimeout(reportTimer);
      if (progressTimer) clearTimeout(progressTimer);
      eventSource?.close();
      reportLoadedRef.current = false;
    };
  }, [applyProgress, sessionId]);

  if (loading) {
    const feedbackRequired = progress?.feedbackRequired ?? 0;
    const feedbackCompleted = progress?.feedbackCompleted ?? 0;
    const feedbackPending = progress?.feedbackPending ?? 0;
    const progressLabel = progress
      ? `Đã chấm ${feedbackCompleted}/${feedbackRequired} câu trả lời`
      : "Đang kiểm tra tiến trình chấm điểm...";
    const detailLabel = progress
      ? feedbackPending > 0
        ? `Còn ${feedbackPending} câu đang xử lý`
        : "Đang tổng hợp báo cáo..."
      : "AI đang chuẩn bị dữ liệu báo cáo.";

    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <LoadingSpinner size="lg" />
        <div className="w-full">
          <p className="text-sm font-semibold text-ink">{progressLabel}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-muted">{detailLabel}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!report) return null;

  const overviewSummary = buildOverviewSummary(report);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Báo cáo phỏng vấn
      </h1>

      <div className="mb-8 rounded-2xl bg-brand p-6 text-white">
        <p className="mb-1 text-sm text-brand-200">Điểm đánh giá tổng</p>
        {report.overallScore == null ? (
          <div>
            <p className="text-2xl font-bold">Chưa thể chấm điểm</p>
            <p className="mt-2 text-sm text-brand-100">
              {report.reportQuality === "not_scorable"
                ? "Phiên này chưa có câu trả lời nào để chấm điểm."
                : "Dịch vụ AI tạm thời chưa khả dụng. Câu trả lời của bạn vẫn đã được lưu."}
            </p>
          </div>
        ) : (
          <p className="text-5xl font-bold">
            {report.overallScore.toFixed(1)}
            <span className="ml-1 text-2xl text-brand-200">/ 100</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {report.reportQuality === "partial" && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Một số câu trả lời không được AI chấm điểm tự động. Điểm tổng chỉ
            tính trên các câu đã đánh giá được.
          </div>
        )}
        {report.reportQuality === "not_scorable" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Bạn đã bỏ qua tất cả câu hỏi, nên báo cáo chỉ hiển thị câu trả lời
            đề xuất để tham khảo.
          </div>
        )}
        {session && <SessionMetadataCard session={session} />}

        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <h2 className="mb-4 text-base font-semibold text-ink">
            Tóm tắt tổng quan
          </h2>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Nhận xét tổng quan
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {overviewSummary.overview}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Các câu trả lời tốt
              </dt>
              <dd className="mt-1">
                {overviewSummary.goodAnswers.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.goodAnswers.map((item) => (
                      <li key={item.label} className="text-sm text-gray-900">
                        {item.label} - {item.score}/100
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500">
                    Chưa có câu trả lời nào đạt từ {GOOD_ANSWER_THRESHOLD}/100.
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Các câu trả lời không tốt
              </dt>
              <dd className="mt-1">
                {overviewSummary.weakAnswers.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.weakAnswers.map((item) => (
                      <li key={item.label} className="text-sm text-gray-900">
                        {item.label} - {item.score}/100
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500">
                    Không có câu trả lời nào dưới {WEAK_ANSWER_THRESHOLD}/100.
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Hướng cần cải thiện
              </dt>
              <dd className="mt-1">
                {overviewSummary.improvementDirections.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.improvementDirections.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-gray-900">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-500">
                    Chưa có đủ dữ liệu để tổng hợp hướng cải thiện.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {session?.contextPackId && session?.sessionType && (
          <ScoringMethodCard
            contextPackId={session.contextPackId}
            sessionType={session.sessionType}
            rubricConfig={rubricConfig}
          />
        )}

        <CompetencyScoreChart scores={report.competencyHeatmap} />

        <div>
          <h2 className="mb-4 text-base font-semibold text-ink">
            Phân tích từng câu trả lời
          </h2>
          <AnnotatedTranscript
            items={report.transcript ?? []}
            contextPackId={session?.contextPackId}
            sessionType={session?.sessionType}
            rubricHint={rubricConfig?.hint}
          />
        </div>
      </div>
    </div>
  );
}

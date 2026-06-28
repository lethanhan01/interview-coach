"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Report, Session } from "@/lib/types";
import AnnotatedTranscript from "@/components/report/AnnotatedTranscript";
import ActionPlanCard from "@/components/report/ActionPlanCard";
import CompetencyScoreChart from "@/components/report/CompetencyScoreChart";
import SessionMetadataCard from "@/components/report/SessionMetadataCard";
import ScoringMethodCard from "@/components/report/ScoringMethodCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const POLL_INTERVAL_MS = 5000;

const EXECUTIVE_SUMMARY_LABELS: Record<string, string> = {
  overallScore: "Điểm tổng",
  totalTurns: "Số câu trả lời",
  summary: "Tóm tắt",
};

function renderSummaryValue(value: unknown): React.ReactNode {
  if (value === null) {
    return <span className="text-sm text-gray-500">Chưa thể chấm</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="mt-1.5 flex flex-col gap-1.5 pl-1">
        {(value as unknown[]).map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-900">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "string" || typeof value === "number") {
    return <span className="text-sm text-gray-900">{String(value)}</span>;
  }
  return <span className="text-sm text-gray-400">{JSON.stringify(value)}</span>;
}

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function fetchReport() {
      try {
        const data = await apiClient.get<Report>(
          `/sessions/${sessionId}/report`,
        );
        setReport(data);
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("REPORT_NOT_READY")) {
          timer = setTimeout(fetchReport, POLL_INTERVAL_MS);
        } else {
          setError(
            err instanceof Error ? err.message : "Không thể tải báo cáo",
          );
          setLoading(false);
        }
      }
    }

    async function fetchSession() {
      try {
        const data = await apiClient.get<Session>(`/sessions/${sessionId}`);
        setSession(data);
      } catch {
        // Session metadata is supplementary — silently ignore errors
      }
    }

    fetchReport();
    fetchSession();

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-ink-muted">
          AI đang tạo báo cáo, vui lòng chờ...
        </p>
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
              Dịch vụ AI tạm thời chưa khả dụng. Câu trả lời của bạn vẫn đã được
              lưu.
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
        {session && <SessionMetadataCard session={session} />}
        {session?.contextPackId && (
          <ScoringMethodCard contextPackId={session.contextPackId} />
        )}

        {report.executiveSummary &&
          Object.keys(report.executiveSummary).length > 0 && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <h2 className="mb-4 text-base font-semibold text-ink">
                Tóm tắt tổng quan
              </h2>
              <dl className="flex flex-col gap-4">
                {Object.entries(report.executiveSummary).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                      {EXECUTIVE_SUMMARY_LABELS[key] ?? key}
                    </dt>
                    <dd className="mt-0.5">{renderSummaryValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

        <CompetencyScoreChart scores={report.competencyHeatmap} />
        <ActionPlanCard actionPlan={report.actionPlan} />

        <div>
          <h2 className="mb-4 text-base font-semibold text-ink">
            Transcript có chú thích
          </h2>
          <AnnotatedTranscript
            items={report.transcript ?? []}
            contextPackId={session?.contextPackId}
          />
        </div>
      </div>
    </div>
  );
}

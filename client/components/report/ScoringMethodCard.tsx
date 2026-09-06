'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion'
import {
  Sparkles,
  ShieldCheck,
  Layers,
  Calculator,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContextPack, SessionType } from '@/lib/types'

export interface ScoringMethodCardProps {
  contextPackId?: ContextPack
  sessionType?: SessionType
  rubricConfig?: unknown
  className?: string
}

export function ScoringMethodCard({
  contextPackId,
  sessionType,
  className,
}: ScoringMethodCardProps) {
  const sessionLabel =
    sessionType === 'technical'
      ? 'Chuyên môn Kỹ thuật'
      : sessionType === 'hr'
        ? 'Phỏng vấn Hành vi & Nhân sự'
        : 'Phỏng vấn Chuẩn hóa'

  return (
    <Card className={cn('flex flex-col gap-5', className)}>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-subtle text-brand-subtle-fg flex size-9 items-center justify-center rounded-lg">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Phương Pháp Đánh Giá Chuẩn Hóa SFIA 9 & O*NET
              </CardTitle>
              <p className="text-ink-muted text-xs">
                Cơ chế chấm điểm tất định, thẩm định nhị phân và đối chiếu cấp độ năng lực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sessionLabel}
            </Badge>
            {contextPackId && (
              <Badge variant="secondary" className="text-xs">
                Bối cảnh: {contextPackId}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-0">
        <div className="bg-brand-subtle/40 border-brand-subtle-border rounded-xl border p-4">
          <p className="text-ink text-xs leading-relaxed">
            Hệ thống áp dụng <strong>Cỗ máy Đánh giá Tinh gọn (Unified Interview Engine)</strong>,
            kết hợp bộ tiêu chí nhị phân 2 chiều và khung kỹ năng toàn cầu <strong>SFIA Version 9</strong> cùng
            phân loại nghề nghiệp chuẩn hóa <strong>O*NET</strong>. Đảm bảo tính khách quan, minh bạch và nhất quán
            cho mọi ứng viên.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
          className="mt-4 divide-border/60 divide-y"
        >
          {/* Mục 1: Tiêu chí Nhị phân 2 Chiều */}
          <AccordionItem value="item-1" className="border-b-0 py-1">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="size-4 text-brand shrink-0" aria-hidden="true" />
                <span className="text-ink text-sm font-semibold">
                  1. Tiêu Chí Đánh Giá Nhị Phân 2 Chiều (Core & Seniority)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-ink flex flex-col gap-2.5 pt-1 text-xs leading-relaxed">
                <p>
                  Mỗi câu trả lời của ứng viên được AI trích xuất bằng chứng (evidence) và đối chiếu
                  chặt chẽ qua 2 chiều nhị phân độc lập (Đạt / Không Đạt):
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="bg-surface-raised border-border/60 rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-brand">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      <span>Chiều Cốt Lõi (Core Dimension)</span>
                    </div>
                    <p className="text-ink-muted mt-1">
                      Kiểm chứng kiến thức kỹ thuật trọng tâm, hiểu biết về nguyên lý nền tảng
                      và mức độ chính xác của giải pháp đề xuất.
                    </p>
                  </div>

                  <div className="bg-surface-raised border-border/60 rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-brand">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      <span>Chiều Thâm Niên (Seniority Dimension)</span>
                    </div>
                    <p className="text-ink-muted mt-1">
                      Kiểm chứng tư duy thiết kế kiến trúc quy mô lớn, tính toán trade-off,
                      khả năng phòng ngừa race condition và xử lý ngoại lệ phức tạp.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mục 2: Thang Cấp bậc Năng lực SFIA 9 */}
          <AccordionItem value="item-2" className="border-b-0 py-1">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <Layers className="size-4 text-brand shrink-0" aria-hidden="true" />
                <span className="text-ink text-sm font-semibold">
                  2. Thang Cấp Bậc Năng Lực Quốc Tế SFIA Version 9 (Level 1-7)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-ink flex flex-col gap-2.5 pt-1 text-xs leading-relaxed">
                <p>
                  Khung kỹ năng SFIA 9 định lượng cấp độ thể hiện thực tế của ứng viên
                  thông qua các hành vi và bằng chứng kỹ thuật:
                </p>
                <div className="bg-surface-raised border-border/60 divide-border/60 divide-y rounded-lg border">
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-ink font-semibold">Level 1 - 2 (Follow & Assist)</span>
                    <span className="text-ink-muted">Cơ bản, thực thi dưới sự hướng dẫn</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-ink font-semibold">Level 3 (Apply)</span>
                    <span className="text-ink-muted">Độc lập giải quyết vấn đề tiêu chuẩn</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-ink font-semibold">Level 4 (Enable)</span>
                    <span className="text-ink-muted">Chủ động hướng dẫn, tối ưu giải pháp</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-ink font-semibold">Level 5 - 7 (Ensure, Advise & Strategy)</span>
                    <span className="text-ink-muted">Định hướng kiến trúc, dẫn dắt chiến lược</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mục 3: Tính điểm tất định & Bỏ qua */}
          <AccordionItem value="item-3" className="border-b-0 py-1">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <Calculator className="size-4 text-brand shrink-0" aria-hidden="true" />
                <span className="text-ink text-sm font-semibold">
                  3. Tính Điểm Tất Định 0-100% & Quy Tắc Bỏ Qua Câu Hỏi
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-ink flex flex-col gap-2 pt-1 text-xs leading-relaxed">
                <p>
                  • <strong>Tính điểm tất định:</strong> Điểm số mỗi câu được tổng hợp trực tiếp
                  từ tỷ lệ đạt các tiêu chí (Pass Rate) kết hợp cấp độ SFIA được chứng minh,
                  loại bỏ hoàn toàn sự cảm tính.
                </p>
                <div className="bg-warning-subtle/30 border-warning text-ink flex items-start gap-2 rounded-lg border-l-2 p-3">
                  <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <p>
                    <strong>Quy tắc câu hỏi bị bỏ qua (Skipped Turn):</strong> Khi ứng viên chủ động
                    bỏ qua câu hỏi hoặc không trả lời, hệ thống sẽ tự động chấm <strong>0 điểm</strong> và
                    xếp cấp độ thể hiện ở <strong>Level 1</strong> theo chuẩn mực thi cử quốc tế.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default ScoringMethodCard

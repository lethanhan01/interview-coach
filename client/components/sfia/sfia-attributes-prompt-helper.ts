/**
 * AI Rubric Prompt Generator & Formatter for SFIA 9 Generic Attributes & Responsibility Levels
 * Used by AI Technical & Behavioral Mock Interview Evaluator
 */

import { toast } from 'sonner'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'
import { SFIA_LEVEL_DEFINITIONS } from './sfia-theme'

export function generateSfiaLevelPromptRubric(
  level: SfiaLevelResponsibility,
  attributes: SfiaGenericAttribute[],
  format: 'markdown' | 'json' = 'markdown'
): string {
  const levelDef = SFIA_LEVEL_DEFINITIONS[level.levelId]

  if (format === 'json') {
    const attributeStatements: Record<string, { name: string; nameVi: string; criteria: string }> = {}
    attributes.forEach((attr) => {
      attributeStatements[attr.code] = {
        name: attr.name,
        nameVi: attr.nameVi,
        criteria: attr.levels[level.levelId] || 'N/A',
      }
    })

    return JSON.stringify(
      {
        framework: 'SFIA 9',
        targetLevel: level.levelId,
        levelName: level.name,
        levelNameVi: level.nameVi,
        essence: level.essence,
        generalDescription: level.description,
        genericAttributes: attributeStatements,
        scoringInstructions: {
          scale: '1-10',
          passThreshold: 7.0,
          rubrics: [
            'Autonomy verification: Candidate acts with independence corresponding to level criteria.',
            'Influence verification: Candidate affects stakeholders and team outcomes at the defined scope.',
            'Complexity verification: Candidate successfully handles problem complexity appropriate for this level.',
            'Business skills & ethics: Candidate communicates professionally and observes digital ethics.',
            'Knowledge depth: Candidate demonstrates appropriate domain and conceptual understanding.',
          ],
        },
      },
      null,
      2
    )
  }

  // Markdown format for LLM System Prompt
  const attributeSections = attributes
    .map((attr) => {
      const statement = attr.levels[level.levelId] || 'Standard behavioral expectation.'
      return `### ${attr.name} (${attr.nameVi})
- **Định nghĩa tổng quát**: ${attr.description}
- **Tiêu chuẩn Level ${level.levelId}**: 
> "${statement}"`
    })
    .join('\n\n')

  return `---
# AI INTERVIEW EVALUATION SYSTEM PROMPT: LEVEL BENCHMARK
# FRAMEWORK: SFIA 9 (Skills Framework for the Information Age)
# LEVEL BENCHMARK: Level ${level.levelId} — ${level.name} (${level.nameVi})
---

You are an expert AI Interview Evaluator assessing whether a candidate's overall professional conduct and behavioral responses align with SFIA 9 Level ${level.levelId}.

## 1. TARGET RESPONSIBILITY LEVEL
- **Level**: Level ${level.levelId}
- **Standard International Name**: ${level.name}
- **Vietnamese Standard**: ${level.nameVi}
- **Short Name**: ${levelDef?.shortName || `L${level.levelId}`}

## 2. CORE ESSENCE & SCOPE OF RESPONSIBILITY
- **Core Essence (Triết lý cốt lõi)**:
> "${level.essence}"

- **General Description (Quyền hạn & Phạm vi)**:
${level.description}

## 3. 5 GENERIC ATTRIBUTES CRITERIA (TIÊU CHUẨN 5 THUỘC TÍNH NỀN TẢNG)
${attributeSections}

## 4. EVALUATION INSTRUCTIONS & SCORING RUBRIC (Scale 1-10)
Evaluate candidate responses across the 5 fundamental pillars:
1. **Autonomy (Mức độ tự chủ)**: Does the candidate operate within the expected supervision bounds?
2. **Influence (Mức độ ảnh hưởng)**: Does the candidate create impact appropriate for Level ${level.levelId}?
3. **Complexity (Độ phức tạp)**: Can the candidate tackle problems with the required ambiguity and scope?
4. **Business Skills (Kỹ năng kinh doanh & Đạo đức)**: Professional communication, teamwork, and accountability.
5. **Knowledge (Kiến thức chuyên môn)**: Depth and breadth of technical/business insight.

## 5. REQUIRED JSON OUTPUT SCHEMA
\`\`\`json
{
  "targetSfiaLevel": ${level.levelId},
  "levelMatched": true,
  "overallScore": 8.5,
  "attributeScores": {
    "autonomy": 8.5,
    "influence": 8.0,
    "complexity": 9.0,
    "businessSkills": 8.5,
    "knowledge": 8.5
  },
  "feedback": {
    "strengths": ["Clear demonstration of autonomous decision making."],
    "growthAreas": ["Could demonstrate wider organizational influence."]
  }
}
\`\`\`
`
}

export async function copySfiaLevelPromptToClipboard(
  level: SfiaLevelResponsibility,
  attributes: SfiaGenericAttribute[],
  format: 'markdown' | 'json' = 'markdown'
): Promise<boolean> {
  try {
    const text = generateSfiaLevelPromptRubric(level, attributes, format)
    await navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép Prompt Rubric Level ${level.levelId}!`, {
      description: `Định dạng ${format.toUpperCase()} đã sẵn sàng để dán vào prompt AI Evaluator.`,
    })
    return true
  } catch (err) {
    toast.error('Không thể sao chép vào bộ nhớ tạm', {
      description: err instanceof Error ? err.message : 'Vui lòng cấp quyền clipboard cho trình duyệt.',
    })
    return false
  }
}

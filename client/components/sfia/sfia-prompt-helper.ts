/**
 * AI Rubric Prompt Generator & Formatter for SFIA 9 Technical Mock Interview Evaluator
 */

import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillDetail,
} from '@/types'

export function generateSfiaRubricMarkdownPrompt(
  skillDetail: SfiaSkillDetail,
  selectedLevel: number,
  levels?: SfiaLevelResponsibility[],
  categories?: SfiaCategory[]
): string {
  const levelDef = levels?.find((l) => l.levelId === selectedLevel)
  const levelLabel = levelDef
    ? `${levelDef.name}${levelDef.nameVi ? ` (${levelDef.nameVi})` : ''}`
    : `L${selectedLevel}`
  const statement = skillDetail.skillLevels.find(
    (sl) => sl.levelId === selectedLevel
  )
  const category = categories?.find((c) => c.code === skillDetail.categoryCode)
  const categoryName =
    category?.nameVi || category?.name || skillDetail.categoryCode

  const prompt = `---
# AI INTERVIEW EVALUATION SYSTEM PROMPT
# FRAMEWORK: SFIA 9 (Skills Framework for the Information Age)
# ROLE: Senior Technical Interview Evaluator & Competency Benchmark Assessor
---

You are an expert AI Interview Evaluator assessing a candidate's competency based on the official SFIA 9 international framework.

## 1. TARGET COMPETENCY BENCHMARK
- **Skill Code**: ${skillDetail.code}
- **Skill Name**: ${skillDetail.name}
- **Category**: ${categoryName} (${skillDetail.categoryCode})
- **Subcategory**: ${skillDetail.subcategoryCode}
- **Target SFIA Level**: Level ${selectedLevel} — ${levelLabel}

## 2. GENERAL LEVEL RESPONSIBILITY & ESSENCE
- **Core Essence**: "${statement?.essence || 'Demonstrates professional competence at this level.'}"
- **General Scope**: Standard SFIA 9 responsibility scope at Level ${selectedLevel}.

## 3. SPECIFIC BEHAVIORAL STATEMENTS (EVALUATION CRITERIA)
The candidate must demonstrate practical evidence aligning with the following criteria:
${statement?.description ? `> "${statement.description}"` : '- Standard SFIA 9 behavioral statement for this level.'}

${skillDetail.guidanceNotes ? `## 4. GUIDANCE NOTES & PRACTICAL CONTEXT\n${skillDetail.guidanceNotes}\n` : ''}
## 5. EVALUATION INSTRUCTIONS & SCORING RUBRICS (1-10 Scale)
Evaluate the candidate's transcript/response on:
1. **Autonomy & Independent Execution** (Does the candidate operate at Level ${selectedLevel} autonomy?)
2. **Technical Rigor & Best Practices** (Adherence to Clean Code, Security, Architecture, Scalability)
3. **Problem-Solving & Complexity Handling** (Depth of logic and reasoning under ambiguous constraints)
4. **Communication & Business Impact** (Clarity of technical communication and stakeholder awareness)

## 6. REQUIRED STRUCTURED OUTPUT FORMAT
Your output MUST be a strict JSON object with the following schema:
\`\`\`json
{
  "sfiaSkillCode": "${skillDetail.code}",
  "evaluatedLevel": ${selectedLevel},
  "overallCompetencyScore": 85,
  "passedLevel": true,
  "scoringBreakdown": {
    "autonomy": 8.5,
    "technicalRigor": 9.0,
    "complexityHandling": 8.0,
    "communication": 8.5
  },
  "keyStrengths": [
    "Clear explanation of architecture patterns",
    "Strong understanding of trade-offs at Level ${selectedLevel}"
  ],
  "competencyGaps": [
    "Could provide more concrete metrics on performance optimization"
  ],
  "evaluatorSummary": "Candidate clearly demonstrates Level ${selectedLevel} proficiency in ${skillDetail.name}..."
}
\`\`\`
`

  return prompt.trim()
}

export function generateSfiaRubricJsonSchema(
  skillDetail: SfiaSkillDetail,
  selectedLevel: number,
  levels?: SfiaLevelResponsibility[]
): string {
  const statement = skillDetail.skillLevels.find(
    (sl) => sl.levelId === selectedLevel
  )
  const levelDef = levels?.find((l) => l.levelId === selectedLevel)

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: `SfiaRubric_${skillDetail.code}_L${selectedLevel}`,
    type: 'object',
    properties: {
      skillCode: { type: 'string', const: skillDetail.code },
      skillName: { type: 'string', const: skillDetail.name },
      targetLevel: { type: 'integer', const: selectedLevel },
      levelName: { type: 'string', const: levelDef?.name },
      levelEssence: { type: 'string', default: statement?.essence },
      behavioralCriteria: {
        type: 'array',
        items: { type: 'string' },
        default: statement?.description ? [statement.description] : [],
      },
      assessmentOutput: {
        type: 'object',
        properties: {
          score: { type: 'number', minimum: 0, maximum: 100 },
          passed: { type: 'boolean' },
          feedback: { type: 'string' },
        },
        required: ['score', 'passed', 'feedback'],
      },
    },
    required: ['skillCode', 'targetLevel', 'assessmentOutput'],
  }

  return JSON.stringify(schema, null, 2)
}

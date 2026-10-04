import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import QuestionCard from './QuestionCard'

describe('QuestionCard', () => {
  it('renders question text and order correctly', () => {
    render(
      <QuestionCard
        questionText="What are your strengths?"
        orderIndex={1}
        totalQuestions={4}
      />
    )

    expect(screen.getByText('What are your strengths?')).toBeInTheDocument()
    expect(screen.getByText('Câu 2 / 4')).toBeInTheDocument()
  })

  it('renders skill badge with formatted label when both skillName and skillCode provided', () => {
    render(
      <QuestionCard
        questionText="Explain polymorphism in OOP."
        orderIndex={0}
        totalQuestions={5}
        skillCode="PROG"
        skillName="Phát triển Phần mềm"
      />
    )

    expect(
      screen.getByText('Phát triển Phần mềm (PROG)')
    ).toBeInTheDocument()
  })

  it('renders skill badge with skillName when only skillName provided', () => {
    render(
      <QuestionCard
        questionText="Tell me about a time you handled conflict."
        orderIndex={2}
        totalQuestions={5}
        skillName="Giao tiếp & Làm việc nhóm"
      />
    )

    expect(
      screen.getByText('Giao tiếp & Làm việc nhóm')
    ).toBeInTheDocument()
  })

  it('renders skill badge with skillCode when only skillCode provided', () => {
    render(
      <QuestionCard
        questionText="How do you write unit tests?"
        orderIndex={3}
        totalQuestions={5}
        skillCode="TEST"
      />
    )

    expect(screen.getByText('TEST')).toBeInTheDocument()
  })

  it('does not render skill badge when neither skillName nor skillCode is provided', () => {
    const { container } = render(
      <QuestionCard
        questionText="Introduce yourself."
        orderIndex={0}
        totalQuestions={3}
      />
    )

    // Badge container should not be rendered
    expect(container.querySelector('[class*="bg-brand-subtle text-brand-subtle-fg"] span')).toBeNull()
  })

  it('does not render tech context chips or rubric criteria (security constraint)', () => {
    render(
      <QuestionCard
        questionText="How do you optimize SQL queries?"
        orderIndex={1}
        totalQuestions={5}
        skillCode="DBDS"
        skillName="Thiết kế Cơ sở Dữ liệu"
        techContext={['PostgreSQL', 'Redis', 'Indexing']}
      />
    )

    // Security & minimalism: O*NET tech context tags and criteria MUST NOT be exposed in live room
    expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument()
    expect(screen.queryByText('Redis')).not.toBeInTheDocument()
    expect(screen.queryByText('Indexing')).not.toBeInTheDocument()
    expect(screen.queryByText(/SFIA Level/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tiêu chí/i)).not.toBeInTheDocument()
  })

  it('merges custom className correctly via cn()', () => {
    const { container } = render(
      <QuestionCard
        questionText="Custom class test"
        orderIndex={0}
        totalQuestions={1}
        className="my-custom-question-card"
      />
    )

    expect(container.firstElementChild).toHaveClass('my-custom-question-card')
  })
})

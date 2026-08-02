import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import QuestionCard from '../../components/interview/QuestionCard'

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
    // orderIndex + 1
    expect(screen.getByText('Câu 2 / 4')).toBeInTheDocument()
  })
})

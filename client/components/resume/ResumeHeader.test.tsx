import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import type { GetProfileResponse } from '@/types'
import ResumeHeader, { calculateCompleteness } from './ResumeHeader'

describe('ResumeHeader', () => {
  it('calculates 0% completeness when profile is null', () => {
    expect(calculateCompleteness(null)).toBe(0)
    expect(
      calculateCompleteness({
        id: '1',
        email: 'test@example.com',
        profile: null,
      })
    ).toBe(0)
  })

  it('calculates 100% completeness when all weighted sections are filled', () => {
    const data: GetProfileResponse = {
      id: '1',
      email: 'test@example.com',
      profile: {
        personality: 'introvert',
        education: {
          degree: 'bachelor',
          school: 'HUST',
          major: 'CS',
          gpa: '3.5',
          graduationYear: '2024',
        },
        technicalSkills: [
          {
            id: 's1',
            category: 'language',
            name: 'TypeScript',
            usagePeriod: 24,
          },
        ],
        workExperience: [
          {
            id: 'w1',
            company: 'Tech Corp',
            position: 'Dev',
            startDate: '2023-01',
            endDate: '2024-01',
            isCurrent: false,
            description: 'Dev work',
            techStack: ['TypeScript'],
          },
        ],
        projects: [
          {
            id: 'p1',
            name: 'Project A',
            description: 'My project',
            techStack: ['TypeScript'],
            url: 'https://example.com',
            startDate: '2023-01',
            endDate: '2023-06',
            isCurrent: false,
          },
        ],
        certifications: [
          {
            id: 'c1',
            type: 'professional',
            name: 'AWS',
            issuer: 'Amazon',
            issueDate: '2023-01-15',
          },
        ],
      },
    }

    expect(calculateCompleteness(data)).toBe(100)
  })

  it('renders StatsRingCard, section navigation, invokes onSelectSection, and passes jest-axe', async () => {
    const user = userEvent.setup()
    const onSelectSection = vi.fn()
    const data: GetProfileResponse = {
      id: '1',
      email: 'test@example.com',
      profile: {
        personality: 'extrovert',
      },
    }

    const { container } = render(
      <ResumeHeader
        data={data}
        activeSection="career"
        onSelectSection={onSelectSection}
      />
    )

    expect(screen.getByText('Độ hoàn thiện hồ sơ CV')).toBeInTheDocument()
    expect(screen.getByText(/Cần bổ sung thêm \(15%\)/i)).toBeInTheDocument()
    expect(screen.getByText('Học vấn')).toBeInTheDocument()
    expect(screen.getByText('Kỹ năng')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Học vấn/i }))
    expect(onSelectSection).toHaveBeenCalledWith('education')

    expect(await axe(container)).toHaveNoViolations()
  })
})

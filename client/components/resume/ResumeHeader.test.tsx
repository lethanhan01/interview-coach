import { render, screen } from '@testing-library/react'
import ResumeHeader, { calculateCompleteness } from './ResumeHeader'
import type { GetProfileResponse } from '@/lib/types'

describe('ResumeHeader', () => {
  it('calculates 0% completeness when profile is null', () => {
    expect(calculateCompleteness(null)).toBe(0)
    expect(calculateCompleteness({ id: '1', email: 'test@example.com', profile: null })).toBe(0)
  })

  it('calculates completeness correctly when sections are filled', () => {
    const data: GetProfileResponse = {
      id: '1',
      email: 'test@example.com',
      profile: {
        personality: 'introvert', // +15
        education: {
          degree: 'bachelor',
          school: 'HUST',
          major: 'CS',
          gpa: '3.5',
          graduationYear: '2024',
        }, // +15
        technicalSkills: [
          { id: 's1', category: 'language', name: 'TypeScript', usagePeriod: 24 },
        ], // +20
        workExperience: [
          {
            id: 'w1',
            company: 'Tech Corp',
            position: 'Dev',
            startDate: '2023-01-01',
            endDate: '2024-01-01',
            isCurrent: false,
            description: 'Dev work',
            techStack: ['TypeScript'],
          },
        ], // +25
        projects: [
          {
            id: 'p1',
            name: 'Project A',
            description: 'My project',
            techStack: ['TypeScript'],
            url: 'https://example.com',
            startDate: '2023-01-01',
            endDate: '2023-06-01',
            isCurrent: false,
          },
        ], // +15
        certifications: [
          {
            id: 'c1',
            type: 'professional',
            name: 'AWS',
            issuer: 'Amazon',
            issueDate: '2023-01-01',
          },
        ], // +10
      },
    }

    expect(calculateCompleteness(data)).toBe(100)
  })

  it('renders progress bar and quick anchor links', () => {
    const data: GetProfileResponse = {
      id: '1',
      email: 'test@example.com',
      profile: {
        personality: 'extrovert',
      },
    }

    render(<ResumeHeader data={data} />)

    expect(screen.getByText('Độ hoàn thiện hồ sơ CV')).toBeInTheDocument()
    expect(screen.getByText(/Cần bổ sung thêm \(15%\)/i)).toBeInTheDocument()
    expect(screen.getByText('Học vấn')).toBeInTheDocument()
    expect(screen.getByText('Kỹ năng')).toBeInTheDocument()
    expect(screen.getByText('Kinh nghiệm')).toBeInTheDocument()
    expect(screen.getByText('Dự án')).toBeInTheDocument()
    expect(screen.getByText('Chứng chỉ & Giải thưởng')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { PageContainer, PageHeader, PageSection, ResponsiveStack } from './LayoutPatterns'

describe('LayoutPatterns', () => {
  describe('PageContainer', () => {
    it('renders correctly', () => {
      render(<PageContainer>Container Content</PageContainer>)
      expect(screen.getByText('Container Content')).toBeInTheDocument()
    })
  })

  describe('PageHeader', () => {
    it('renders title and description', () => {
      render(<PageHeader title="Header Title" description="Header Desc" />)
      expect(screen.getByText('Header Title')).toBeInTheDocument()
      expect(screen.getByText('Header Desc')).toBeInTheDocument()
    })

    it('renders breadcrumbs and actions', () => {
      render(
        <PageHeader 
          title="Title" 
          breadcrumbs={<span>Breadcrumbs</span>}
          actions={<button>Action Btn</button>}
        />
      )
      expect(screen.getByText('Breadcrumbs')).toBeInTheDocument()
      expect(screen.getByText('Action Btn')).toBeInTheDocument()
    })
  })

  describe('PageSection', () => {
    it('renders correctly', () => {
      render(
        <PageSection title="Section Title" description="Section Desc">
          Section Content
        </PageSection>
      )
      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Section Desc')).toBeInTheDocument()
      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })
  })

  describe('ResponsiveStack', () => {
    it('renders children correctly', () => {
      render(
        <ResponsiveStack>
          <div>Child 1</div>
          <div>Child 2</div>
        </ResponsiveStack>
      )
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })
})

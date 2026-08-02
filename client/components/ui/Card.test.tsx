import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './Card'
import { axe } from 'jest-axe'

describe('Card Component', () => {
  it('renders all card parts correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('applies hover styles when hover prop is true', () => {
    render(<Card hover data-testid="hover-card" />)
    const card = screen.getByTestId('hover-card')
    expect(card).toHaveClass('hover:-translate-y-0.5')
  })

  it('should pass a11y tests', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Some accessible content</p>
        </CardContent>
        <CardFooter>Footer Info</CardFooter>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

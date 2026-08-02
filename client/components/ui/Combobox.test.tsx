import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { Combobox } from './Combobox'

describe('Combobox Component', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]

  const ComboboxWrapper = (
    props: Omit<React.ComponentProps<typeof Combobox>, 'options'> & {
      options?: React.ComponentProps<typeof Combobox>['options']
    }
  ) => {
    const [val, setVal] = React.useState(props.value || '')
    return <Combobox {...props} value={val} onValueChange={setVal} options={props.options || options} aria-label={props['aria-label'] || 'Combobox'} />
  }

  it('renders correctly', () => {
    render(<ComboboxWrapper placeholder="Select item" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select item')).toBeInTheDocument()
  })

  it('opens options on click', async () => {
    render(<ComboboxWrapper />)
    const trigger = screen.getByRole('combobox')
    await userEvent.click(trigger)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('selects an option', async () => {
    render(<ComboboxWrapper />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Option 1'))
    
    expect(screen.getByRole('combobox')).toHaveTextContent('Option 1')
  })

  it('passes a11y tests', async () => {
    const { container } = render(<ComboboxWrapper />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

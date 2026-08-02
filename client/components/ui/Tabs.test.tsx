import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
import { axe } from 'jest-axe'

describe('Tabs Interaction Tests', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('supports keyboard navigation between tabs', async () => {
    const user = userEvent.setup()

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    // Initial state
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()

    // Focus the active tab
    const tab1 = screen.getByRole('tab', { name: /tab 1/i })
    const tab2 = screen.getByRole('tab', { name: /tab 2/i })

    tab1.focus()
    expect(tab1).toHaveFocus()

    // Navigate right
    await user.keyboard('{ArrowRight}')

    await waitFor(() => {
      // By default radix UI tabs activate on focus
      expect(tab2).toHaveFocus()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })

    // Navigate left
    await user.keyboard('{ArrowLeft}')

    await waitFor(() => {
      expect(tab1).toHaveFocus()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })
  })
})

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';

describe('Accordion', () => {
  const TestAccordion = ({ type = 'single', collapsible = true }: any) => (
    <Accordion type={type} collapsible={collapsible}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Item 1</AccordionTrigger>
        <AccordionContent>Content 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Item 2</AccordionTrigger>
        <AccordionContent>Content 2</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  it('renders correctly', () => {
    render(<TestAccordion />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TestAccordion />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('expands item on click', async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);
    const trigger = screen.getByText('Item 1');
    
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeVisible();
    });
  });

  it('collapses expanded item on click when collapsible is true', async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);
    const trigger = screen.getByText('Item 1');
    
    // Open
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeVisible();
    });
    
    // Close
    await user.click(trigger);
    await waitFor(() => {
      const content = screen.queryByText('Content 1');
      if (content) {
        expect(content).not.toBeVisible();
      } else {
        expect(content).not.toBeInTheDocument();
      }
    });
  });
  
  it('allows multiple items to be expanded when type is multiple', async () => {
    const user = userEvent.setup();
    render(<TestAccordion type="multiple" collapsible={undefined} />);
    const trigger1 = screen.getByText('Item 1');
    const trigger2 = screen.getByText('Item 2');
    
    await user.click(trigger1);
    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeVisible();
    });
    
    await user.click(trigger2);
    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeVisible();
    });
  });
});

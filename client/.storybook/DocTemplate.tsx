import React from 'react'
import {
  Title,
  Subtitle,
  Description,
  Primary,
  Controls,
  Stories,
  Markdown,
  DocsContext,
} from '@storybook/addon-docs/blocks'

export default function DocTemplate() {
  const context = React.useContext(DocsContext)
  
  // Extract docs parameters
  const primaryStory = context.componentStories?.()?.[0]
  const docsParams = primaryStory?.parameters?.docs || {}
                     
  const { whenToUse, whenNotToUse, accessibilityNotes } = docsParams

  return (
    <div className="storybook-docs-template">
      <Title />
      <Subtitle />
      <Description />
      
      {whenToUse && Array.isArray(whenToUse) && (
        <div style={{ margin: '24px 0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>✅ Khi nào nên dùng</h3>
          <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
            {whenToUse.map((item: string, i: number) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {whenNotToUse && Array.isArray(whenNotToUse) && (
        <div style={{ margin: '24px 0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>❌ Khi nào KHÔNG nên dùng</h3>
          <ul style={{ paddingLeft: '20px', listStyleType: 'disc', color: '#dc2626' }}>
            {whenNotToUse.map((item: string, i: number) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      <div style={{ margin: '32px 0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Props & Tùy chỉnh (API)</h3>
        <Controls />
      </div>
      
      <div style={{ margin: '32px 0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Trạng thái mặc định (Default)</h3>
        <Primary />
      </div>
      
      {accessibilityNotes && (
        <div style={{ margin: '32px 0', padding: '16px', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '0 4px 4px 0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>♿ Accessibility (A11y)</h3>
          <Markdown>{accessibilityNotes}</Markdown>
        </div>
      )}
      
      <div style={{ margin: '32px 0' }}>
        <Stories title="Tất cả các biến thể (Variants & States)" />
      </div>
    </div>
  )
}

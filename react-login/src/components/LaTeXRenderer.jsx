import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const LaTeXRenderer = ({ content }) => {
  if (!content) return null;

  // Process Markdown images first, then LaTeX
  const processMarkdown = (text) => {
    // Handle Markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = imageRegex.exec(text)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...renderWithLatex(beforeText, parts.length));
      }
      
      // Add the image
      const altText = match[1] || 'Image';
      const imageUrl = match[2];
      parts.push(
        <div key={`image-${parts.length}`} style={{ margin: '20px 0', textAlign: 'center' }}>
          <img 
            src={imageUrl} 
            alt={altText}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              // Show a placeholder or error message
              const errorDiv = document.createElement('div');
              errorDiv.style.cssText = 'padding: 20px; border: 2px dashed #ccc; text-align: center; color: #666; border-radius: 8px; margin: 20px 0;';
              errorDiv.textContent = `Failed to load image: ${altText}`;
              e.target.parentNode.appendChild(errorDiv);
            }}
          />
        </div>
      );
      
      lastIndex = imageRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...renderWithLatex(remainingText, parts.length));
    }
    
    // If no images found, just process LaTeX
    if (parts.length === 0) {
      return renderWithLatex(text, 0);
    }
    
    return parts;
  };

  // Split content by LaTeX blocks and inline math
  const renderWithLatex = (text, startIndex = 0) => {
    // Handle block math first ($$...$$)
    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineMathRegex = /\$(.*?)\$/g;
    
    let parts = [];
    let lastIndex = 0;
    let match;
    
    // Process block math
    while ((match = blockMathRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(...processInlineMath(beforeText, startIndex + parts.length));
      }
      
      // Add the block math
      parts.push(
        <div key={`block-${parts.length}`} style={{ margin: '20px 0', textAlign: 'center' }}>
          <BlockMath math={match[1].trim()} />
        </div>
      );
      
      lastIndex = blockMathRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...processInlineMath(remainingText, startIndex + parts.length));
    }
    
    return parts;
  };

  const processInlineMath = (text, startIndex) => {
    const inlineMathRegex = /\$(.*?)\$/g;
    let parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = inlineMathRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push(
            <span key={`text-${startIndex}-${parts.length}`}>
              {beforeText}
            </span>
          );
        }
      }
      
      // Add the inline math
      parts.push(
        <InlineMath key={`inline-${startIndex}-${parts.length}`} math={match[1]} />
      );
      
      lastIndex = inlineMathRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={`text-${startIndex}-${parts.length}`}>
            {remainingText}
          </span>
        );
      }
    }
    
    // If no math was found, return the original text
    if (parts.length === 0) {
      return [<span key={`text-${startIndex}`}>{text}</span>];
    }
    
    return parts;
  };

  // Split content by line breaks and process each line
  const lines = content.split('\n');
  
  return (
    <div>
      {lines.map((line, index) => (
        <div key={index} style={{ marginBottom: line.trim() === '' ? '16px' : '0' }}>
          {line.trim() === '' ? (
            <br />
          ) : (
            processMarkdown(line)
          )}
        </div>
      ))}
    </div>
  );
};

export default LaTeXRenderer;
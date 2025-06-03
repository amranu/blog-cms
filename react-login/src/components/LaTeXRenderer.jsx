import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const LaTeXRenderer = ({ content }) => {
  if (!content) return null;

  // Split content by LaTeX blocks and inline math
  const renderWithLatex = (text) => {
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
        parts.push(...processInlineMath(beforeText, parts.length));
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
      parts.push(...processInlineMath(remainingText, parts.length));
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
            renderWithLatex(line)
          )}
        </div>
      ))}
    </div>
  );
};

export default LaTeXRenderer;
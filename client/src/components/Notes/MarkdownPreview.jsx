import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const MarkdownPreview = ({ content, emptyMessage = 'Start writing to preview your note.' }) => (
  <div className="markdown-body">
    {content.trim() ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    ) : (
      <div className="empty-inline-state">{emptyMessage}</div>
    )}
  </div>
);

export default MarkdownPreview;

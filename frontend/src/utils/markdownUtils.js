import DOMPurify from 'dompurify';

/**
 * Sanitizes markdown content to prevent XSS attacks
 * @param {string} content - The markdown content to sanitize
 * @returns {string} - The sanitized markdown content
 */
export const sanitizeMarkdown = (content) => {
  return DOMPurify.sanitize(content);
};

/**
 * Returns the styles to be applied to rendered markdown content
 * @returns {Object} - CSS styles for markdown content
 */
export const getMarkdownStyles = () => ({
  markdown: {
    '& h1': {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      marginTop: '1.5rem',
    },
    '& h2': {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      marginBottom: '0.875rem',
      marginTop: '1.5rem',
    },
    '& h3': {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.75rem',
      marginTop: '1.25rem',
    },
    '& h4': {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '0.625rem',
      marginTop: '1.25rem',
    },
    '& p': {
      marginBottom: '1rem',
    },
    '& ul, & ol': {
      marginLeft: '2rem',
      marginBottom: '1rem',
    },
    '& li': {
      marginBottom: '0.5rem',
    },
    '& a': {
      color: '#02e6ef',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& code': {
      backgroundColor: '#f8f9fa',
      color: '#d73e48',
      padding: '0.2rem 0.4rem',
      borderRadius: '4px',
      fontFamily:
        '"Fira Code", "Cascadia Code", "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      fontSize: '0.875em',
      fontWeight: '500',
      border: '1px solid #e9ecef',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    '& pre': {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      padding: '1.5rem',
      borderRadius: '8px',
      overflow: 'auto',
      marginBottom: '1.5rem',
      border: '1px solid #333',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      position: 'relative',
      fontFamily:
        '"Fira Code", "Cascadia Code", "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      fontSize: '0.875em',
      lineHeight: '1.6',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #02e6ef, #00bfa5)',
        borderRadius: '8px 8px 0 0',
      },
      '& code': {
        backgroundColor: 'transparent',
        color: 'inherit',
        padding: 0,
        border: 'none',
        boxShadow: 'none',
        fontSize: 'inherit',
        fontFamily: 'inherit',
      },
    },
    '& blockquote': {
      borderLeft: '4px solid #e0e0e0',
      paddingLeft: '1rem',
      fontStyle: 'italic',
      margin: '1rem 0',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      marginBottom: '1rem',
    },
    '& th, & td': {
      border: '1px solid #e0e0e0',
      padding: '0.5rem',
    },
    '& img': {
      maxWidth: '100% !important',
      width: 'auto !important',
      height: 'auto !important',
      display: 'block',
      margin: '1rem auto',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      objectFit: 'contain',
      boxSizing: 'border-box',
    },
    // Additional selectors to ensure all image containers are constrained
    '& p img, & div img, & figure img': {
      maxWidth: '100% !important',
      width: 'auto !important',
      height: 'auto !important',
      objectFit: 'contain',
    },
    '& figure': {
      maxWidth: '100%',
      margin: '1rem auto',
      textAlign: 'center',
    },
  },
});

/**
 * Converts markdown to HTML with enhanced code block styling
 * This function provides consistent styling across all markdown previews
 * @param {string} markdown - Raw markdown content
 * @returns {string} HTML with enhanced styling
 */
export const convertMarkdownToHTML = (markdown) => {
  if (!markdown) return '';

  const plainText = sanitizeMarkdown(markdown);

  // Enhanced markdown-to-HTML conversion with modern dark theme code blocks
  const html = plainText
    // Code blocks (triple backticks) - enhanced with modern dark theme
    .replace(/```([^`]*?)```/gims, (match, code) => {
      const cleanCode = code.trim();
      return `<div style="position: relative; margin: 16px 0; border-radius: 8px; background: #1e1e1e; border: 1px solid #333; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div style="background: linear-gradient(90deg, #02e6ef, #00bfa5); height: 2px;"></div>
        <pre style="margin: 0; padding: 24px; background: transparent; color: #d4d4d4; font-family: 'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 14px; line-height: 1.6; overflow-x: auto;"><code>${cleanCode}</code></pre>
      </div>`;
    })
    // Inline code (single backticks)
    .replace(
      /`([^`]+)`/g,
      "<code style=\"background: rgba(2, 230, 239, 0.1); color: #02e6ef; padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 0.9em;\">$1</code>",
    )
    // Images
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/gim,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; margin: 1rem auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />',
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color: #02e6ef; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s;" onmouseover="this.style.borderBottomColor=\'#02e6ef\'" onmouseout="this.style.borderBottomColor=\'transparent\'">$1</a>',
    )
    // Blockquotes
    .replace(
      /^> (.+)$/gim,
      '<blockquote style="border-left: 4px solid #e0e0e0; padding-left: 1rem; font-style: italic; margin: 1rem 0; color: #666;">$1</blockquote>',
    )
    // Headers
    .replace(
      /^### (.*$)/gim,
      '<h3 style="color: #333; font-weight: 600; margin: 20px 0 12px 0; font-size: 1.2em;">$1</h3>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 style="color: #333; font-weight: 600; margin: 24px 0 16px 0; font-size: 1.4em;">$1</h2>',
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 style="color: #333; font-weight: 700; margin: 28px 0 20px 0; font-size: 1.6em;">$1</h1>',
    )
    // Unordered lists (convert to <li> first, then wrap in <ul>)
    .replace(/^\* (.+)$/gim, '<li style="margin-bottom: 0.5rem;">$1</li>')
    .replace(/^- (.+)$/gim, '<li style="margin-bottom: 0.5rem;">$1</li>')
    // Bold text
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="font-weight: 600; color: #333;">$1</strong>',
    )
    .replace(
      /__(.*?)__/g,
      '<strong style="font-weight: 600; color: #333;">$1</strong>',
    )
    // Italic text
    .replace(
      /\*(.*?)\*/g,
      '<em style="font-style: italic; color: #555;">$1</em>',
    )
    .replace(/_(.*?)_/g, '<em style="font-style: italic; color: #555;">$1</em>')
    // Highlighted text (using ==text== syntax)
    .replace(
      /==(.*?)==/gim,
      '<mark style="background: #ffeb3b; padding: 2px 4px; border-radius: 2px;">$1</mark>',
    )
    // Line breaks
    .replace(/\n/g, '<br>');
  // Wrap consecutive <li> elements in <ul>
  const finalHtml = html.replace(
    /(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gims,
    '<ul style="margin-left: 2rem; margin-bottom: 1rem;">$1</ul>',
  );

  return finalHtml;
};

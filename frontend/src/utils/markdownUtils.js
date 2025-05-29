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
export const getMarkdownStyles = () => {
  return {
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
        backgroundColor: '#f5f5f5',
        padding: '0.2rem 0.4rem',
        borderRadius: '3px',
        fontFamily: 'monospace',
        fontSize: '0.9em',
      },
      '& pre': {
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '4px',
        overflow: 'auto',
        marginBottom: '1rem',
        '& code': {
          backgroundColor: 'transparent',
          padding: 0,
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
        maxWidth: '100%',
        height: 'auto',
      },
    },
  };
};

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import "../../../styles/markdown.scss";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button className="md-code__copy" onClick={handleCopy} aria-label="Copy code">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ─── Code blocks ──────────────────
          code({ inline, className, children, ...props }) {
            const match = /language-([^\s]+)/.exec(className || "");
            const codeText = String(children).replace(/\n$/, "");
            const language = match?.[1] || "text";

            if (!inline && match) {
              return (
                <div className="md-code">
                  <div className="md-code__header">
                    <span className="md-code__lang">{language}</span>
                    <CopyButton text={codeText} />
                  </div>
                  <SyntaxHighlighter
                    className="md-code__syntax"
                    language={language}
                    PreTag="div"
                    useInlineStyles={false}
                    codeTagProps={{ className: "md-code__content" }}
                    customStyle={{ margin: 0 }}
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (!inline && !match) {
              return (
                <div className="md-code">
                  <div className="md-code__header">
                    <span className="md-code__lang">code</span>
                    <CopyButton text={codeText} />
                  </div>
                  <pre className="md-code__plain">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="md-inline-code" {...props}>
                {children}
              </code>
            );
          },

          // ─── Tables ───────────────────────
          table({ children, ...props }) {
            return (
              <div className="md-table-wrap">
                <table className="md-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }) {
            return <thead className="md-table__head" {...props}>{children}</thead>;
          },
          tbody({ children, ...props }) {
            return <tbody className="md-table__body" {...props}>{children}</tbody>;
          },
          tr({ children, ...props }) {
            return <tr className="md-table__row" {...props}>{children}</tr>;
          },
          th({ children, ...props }) {
            return <th className="md-table__th" {...props}>{children}</th>;
          },
          td({ children, ...props }) {
            return <td className="md-table__td" {...props}>{children}</td>;
          },

          // ─── Blockquotes ──────────────────
          blockquote({ children, ...props }) {
            return (
              <blockquote className="md-blockquote" {...props}>
                {children}
              </blockquote>
            );
          },

          // ─── Lists ────────────────────────
          ul({ children, ...props }) {
            return <ul className="md-list md-list--ul" {...props}>{children}</ul>;
          },
          ol({ children, ...props }) {
            return <ol className="md-list md-list--ol" {...props}>{children}</ol>;
          },
          li({ children, ...props }) {
            return <li className="md-list__item" {...props}>{children}</li>;
          },

          // ─── Headings ─────────────────────
          h1({ children, ...props }) {
            return <h1 className="md-heading md-h1" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="md-heading md-h2" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="md-heading md-h3" {...props}>{children}</h3>;
          },
          h4({ children, ...props }) {
            return <h4 className="md-heading md-h4" {...props}>{children}</h4>;
          },

          // ─── Paragraphs ───────────────────
          p({ children, ...props }) {
            return <p className="md-paragraph" {...props}>{children}</p>;
          },

          // ─── Links ────────────────────────
          a({ children, href, ...props }) {
            return (
              <a
                className="md-link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },

          // ─── Horizontal rule ──────────────
          hr({ ...props }) {
            return <hr className="md-hr" {...props} />;
          },

          // ─── Strong / Em ──────────────────
          strong({ children, ...props }) {
            return <strong className="md-strong" {...props}>{children}</strong>;
          },
          em({ children, ...props }) {
            return <em className="md-em" {...props}>{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

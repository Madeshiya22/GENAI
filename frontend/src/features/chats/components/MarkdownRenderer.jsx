import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import "../../../styles/markdown.scss";

// ─── Copy button ───────────────────────────────────────────────────────────────
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
        // Checkmark icon
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        // Copy icon
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
};

// ─── Code icon ────────────────────────────────────────────────────────────────
const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

// ─── Main renderer ────────────────────────────────────────────────────────────
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{

          // ─── Block code ───────────────────────────────────────────────────
          // In react-markdown v10, the `pre` renderer receives the raw hast
          // AST node via `node`. We read node.children[0] (the <code> hast
          // node) to get the language class and raw text BEFORE any React
          // rendering happens — this is the only reliable approach in v10.
          pre({ node }) {
            // Walk the hast AST: pre → code node
            const codeNode = node?.children?.[0];
            const isCodeNode = codeNode?.type === "element" && codeNode?.tagName === "code";

            if (!isCodeNode) {
              // Rare fallback: bare <pre> without <code> child
              const rawText = node?.children?.map(c => c.value || "").join("") || "";
              return (
                <div className="md-code">
                  <div className="md-code__header">
                    <span className="md-code__lang"><CodeIcon />text</span>
                    <CopyButton text={rawText} />
                  </div>
                  <div className="md-code__syntax">
                    <div className="md-code__content" style={{ padding: "18px 20px" }}>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{rawText}</pre>
                    </div>
                  </div>
                </div>
              );
            }

            // Extract language from className array, e.g. ["language-javascript"]
            const classNames = codeNode.properties?.className || [];
            const langClass = classNames.find(c => c.startsWith("language-"));
            const language = langClass ? langClass.replace("language-", "") : "text";

            // Extract raw code text from the hast text child
            const rawCode = codeNode.children
              ?.map(child => child.value || "")
              .join("") || "";
            const codeText = rawCode.replace(/\n$/, "");

            return (
              <div className="md-code">
                <div className="md-code__header">
                  <span className="md-code__lang">
                    <CodeIcon />
                    {language}
                  </span>
                  <CopyButton text={codeText} />
                </div>
                <SyntaxHighlighter
                  className="md-code__syntax"
                  language={language}
                  PreTag="div"
                  useInlineStyles={false}
                  codeTagProps={{ className: "md-code__content" }}
                  customStyle={{ margin: 0 }}
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            );
          },

          // ─── Inline code ──────────────────────────────────────────────────
          // Since `pre` now fully handles all block code above (bypassing the
          // React element tree), any `code` that reaches this renderer is
          // ONLY ever inline code (e.g. `variable`).
          code({ children, ...props }) {
            return (
              <code className="md-inline-code" {...props}>
                {children}
              </code>
            );
          },

          // ─── Tables ───────────────────────────────────────────────────────
          table({ children, ...props }) {
            return (
              <div className="md-table-wrap">
                <table className="md-table" {...props}>{children}</table>
              </div>
            );
          },
          thead({ children, ...props }) { return <thead className="md-table__head" {...props}>{children}</thead>; },
          tbody({ children, ...props }) { return <tbody className="md-table__body" {...props}>{children}</tbody>; },
          tr({ children, ...props })    { return <tr className="md-table__row" {...props}>{children}</tr>; },
          th({ children, ...props })    { return <th className="md-table__th" {...props}>{children}</th>; },
          td({ children, ...props })    { return <td className="md-table__td" {...props}>{children}</td>; },

          // ─── Blockquote ───────────────────────────────────────────────────
          blockquote({ children, ...props }) {
            return <blockquote className="md-blockquote" {...props}>{children}</blockquote>;
          },

          // ─── Lists ────────────────────────────────────────────────────────
          ul({ children, ...props }) { return <ul className="md-list md-list--ul" {...props}>{children}</ul>; },
          ol({ children, ...props }) { return <ol className="md-list md-list--ol" {...props}>{children}</ol>; },
          li({ children, ...props }) { return <li className="md-list__item" {...props}>{children}</li>; },

          // ─── Headings ─────────────────────────────────────────────────────
          h1({ children, ...props }) { return <h1 className="md-heading md-h1" {...props}>{children}</h1>; },
          h2({ children, ...props }) { return <h2 className="md-heading md-h2" {...props}>{children}</h2>; },
          h3({ children, ...props }) { return <h3 className="md-heading md-h3" {...props}>{children}</h3>; },
          h4({ children, ...props }) { return <h4 className="md-heading md-h4" {...props}>{children}</h4>; },

          // ─── Paragraph ────────────────────────────────────────────────────
          p({ children, ...props }) { return <p className="md-paragraph" {...props}>{children}</p>; },

          // ─── Links ────────────────────────────────────────────────────────
          a({ children, href, ...props }) {
            return (
              <a className="md-link" href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },

          // ─── Misc ─────────────────────────────────────────────────────────
          hr({ ...props })               { return <hr className="md-hr" {...props} />; },
          strong({ children, ...props }) { return <strong className="md-strong" {...props}>{children}</strong>; },
          em({ children, ...props })     { return <em className="md-em" {...props}>{children}</em>; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

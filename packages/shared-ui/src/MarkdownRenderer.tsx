"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-black/40 border border-white/5 rounded-lg p-4 overflow-x-auto my-3">
                <code className={`${className} text-[12px]`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          p({ children }) {
            return <p className="text-[13px] text-zinc-400 mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-4 mb-2.5 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-4 mb-2.5 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[13px] text-zinc-400 leading-relaxed">{children}</li>;
          },
          strong({ children }) {
            return <strong className="text-zinc-200 font-semibold">{children}</strong>;
          },
          h1({ children }) {
            return <h1 className="text-base font-semibold text-zinc-200 mb-2 mt-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-semibold text-zinc-200 mb-2 mt-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-zinc-300 mb-1.5 mt-2">{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CoBuilders — Fork Management",
  description: "Manage your CoBuilders devnet forks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --bg: #0a0a0a;
            --surface: #141414;
            --surface2: #1e1e1e;
            --border: #2a2a2a;
            --text: #e5e5e5;
            --text2: #999;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --green: #22c55e;
            --orange: #f59e0b;
            --red: #ef4444;
            --mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
          }
          .container { max-width: 960px; margin: 0 auto; padding: 0 1.5rem; }
          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }
          /* Buttons */
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
          }
          .btn:active { transform: scale(0.98); }
          .btn-primary { background: var(--accent); color: white; }
          .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
          .btn-danger { background: var(--red); color: white; }
          .btn-danger:hover:not(:disabled) { background: #dc2626; }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          /* Modal */
          .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.75);
            z-index: 100;
            align-items: center;
            justify-content: center;
          }
          .modal-overlay.active { display: flex; }
          .modal {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            max-width: 450px;
            width: 90%;
          }
          .modal h3 { margin-bottom: 0.75rem; }
          .modal-actions { display: flex; gap: 0.75rem; justify-content: center; }
          input:focus, select:focus {
            outline: none;
            border-color: var(--accent) !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}

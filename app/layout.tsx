// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NoteAI — Handwritten Notebook Generator',
  description:
    'Turn any topic into stunning handwritten notebook-style notes. Powered by GROQ AI. Create, customize, and download beautiful study notes instantly.',
  keywords: 'notebook generator, handwritten notes, study notes, AI notes, GROQ',
  openGraph: {
    title: 'NoteAI — Handwritten Notebook Generator',
    description: 'Create beautiful handwritten study notes with AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=Patrick+Hand&family=Kalam:wght@300;400;700&family=Permanent+Marker&family=Indie+Flower&family=Shadows+Into+Light&family=Rock+Salt&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Bangladesh Government IT Job Prep | Smart Quiz & Analytics',
  description:
    'Prepare for Bangladesh Bank AD (IT), BPSC IT Officer, ICT Ministry, and Nationalized Bank IT recruitment tests with smart topic quizzes and detailed analytics.',
  keywords: [
    'Bangladesh Bank AD IT',
    'BPSC IT Officer',
    'Govt IT job preparation',
    'Database Keys quiz',
    'Networking quiz',
    'SWE IT mock test',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MARS ORBITAL MISSION — Mission Control',
  description: 'Trò chơi mô phỏng giáo dục nhiệm vụ đưa vệ tinh tới quỹ đạo Sao Hỏa (Next.js Edition)',
};

export const viewport: Viewport = {
  themeColor: '#07111f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

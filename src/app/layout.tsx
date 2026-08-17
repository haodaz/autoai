import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import I18nProvider from '@/components/I18nProvider';
import AuthGuard from '@/components/auth/AuthGuard';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "平方工作台",
  description: "平方工作台 — 教育科技人才行业多智能体办公系统",
  // viewport-fit=cover 由 viewport export 指定
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <I18nProvider>
            <AuthGuard>
              <div id="app-root" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
            </AuthGuard>
          </I18nProvider>
        </AntdRegistry>
        <style>{`
          /* ── 全局触控优化：去除 iOS 点击高亮 ── */
          * { -webkit-tap-highlight-color: transparent; }
        `}</style>
      </body>
    </html>
  );
}

// import global css files
import '@/app/ui/global.css';

// import fonts
// import { Inter } from 'next/font/google';
// const inter = Inter({ subsets: ['latin'] });
import { inter } from '@/app/ui/fonts';

// Define metadata
export const metadata = {
  title: 'Create Next app',
  description: 'Generated by create nect app',
};

// Define a Root layout function
export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
import '../index.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/NavbarNext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SHIELD AI • Tactical Platform',
  description: 'National Tourist Safety & Monitoring Protocol',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050505] text-white`}>
        <Toaster position="top-right" />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

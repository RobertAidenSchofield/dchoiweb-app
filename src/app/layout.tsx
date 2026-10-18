import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dchoidesigns.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DCHOI DESIGNS | Hand-Crafted Knife Sayas & Artisan Woodcraft',
    template: '%s | DCHOI DESIGNS',
  },
  description:
    'Hand-crafted wooden knife sayas, end-grain cutting boards, and bespoke furniture carved slowly by David Choi in Chicago, IL.',
  keywords: [
    'saya',
    'knife sheath',
    'custom saya',
    'Japanese knife sheath',
    'Santoku saya',
    'Gyuto saya',
    'cutting board',
    'David Choi',
    'Chicago woodcraft',
    'artisan knife guard',
  ],
  authors: [{ name: 'David Choi', url: siteUrl }],
  creator: 'David Choi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'DCHOI DESIGNS | Useful things, made slowly.',
    description:
      'Original premium furniture, hand-crafted sayas, and custom blade fitments made slowly in Chicago.',
    siteName: 'DCHOI DESIGNS',
    images: [
      {
        url: 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=1500w',
        width: 1500,
        height: 1000,
        alt: 'DCHOI DESIGNS Artisan Saya Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DCHOI DESIGNS | Hand-Crafted Knife Sayas',
    description:
      'Hand-carved knife sayas and bespoke woodwork by David Choi in Chicago.',
    images: [
      'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=1500w',
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className='h-full antialiased'
    >
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  );
}

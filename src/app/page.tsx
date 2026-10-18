'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Menu,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Product } from '@/types/store';
import {
  INITIAL_PRODUCTS,
  STORAGE_KEYS,
  loadStoredData,
} from '@/lib/storeManager';

import { useStudioClocks } from '@/hooks/useStudioClocks';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Live Studio Dual Clocks (Chicago & Tokyo)
  const { chicagoTime, tokyoTime } = useStudioClocks();

  // Interactive Studio Ambient Audio Player
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Load dynamic products from storage so user-uploaded items appear
    const timer = setTimeout(() => {
      const loaded = loadStoredData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      if (loaded && loaded.length > 0) {
        setProducts(loaded);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Web Audio Studio Ambient Sound Generator
  function toggleStudioAudio() {
    if (isPlayingAudio) {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current && AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;

          // Warm harmonic ambient resonance (432Hz base wood warmth)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(432, ctx.currentTime);

          gain.gain.setValueAtTime(0.04, ctx.currentTime);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();

          oscillatorRef.current = osc;
          gainNodeRef.current = gain;
        } else if (audioCtxRef.current) {
          audioCtxRef.current.resume();
        }
        setIsPlayingAudio(true);
      } catch (err) {
        console.error('Audio synthesizer error:', err);
      }
    }
  }

  function toggleMute() {
    if (gainNodeRef.current && audioCtxRef.current) {
      if (isMuted) {
        gainNodeRef.current.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);
        setIsMuted(false);
      } else {
        gainNodeRef.current.gain.setValueAtTime(0.0001, audioCtxRef.current.currentTime);
        setIsMuted(true);
      }
    }
  }

  const featuredProduct = products[0] || INITIAL_PRODUCTS[0];
  const catalogPieces = products.slice(1, 5);

  const socialPhotos = [
    {
      img: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80',
      title: 'Hand Plane Kanna Shavings',
    },
    {
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      title: 'Aged Black Walnut Grain',
    },
    {
      img: 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=800w',
      title: 'Custom Saya Sheaths',
    },
    {
      img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
      title: 'Japanese Magnolia Fitting',
    },
    {
      img: 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1707765193847-22CXIFLNEX9QZ8PSYEA3/walnut+large+sizing.jpg?format=800w',
      title: 'End-Grain Cutting Board Batch',
    },
    {
      img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      title: 'Slatted Coffee Table Joinery',
    },
    {
      img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      title: 'Chicago Studio Bench',
    },
    {
      img: 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1614742749363-U0U2U15998W8X2P8K4O8/Dchoi+Design+custom+furniture+Chicago.jpg?format=800w',
      title: 'Hand-carved Ebony Saya Pins',
    },
  ];

  return (
    <div className='stereo-root'>
      {/* ------------------------------------------------------------------- */}
      {/* 1. FLOATING GLASS HEADER (DESKTOP)                                  */}
      {/* ------------------------------------------------------------------- */}
      <header className='stereo-header-desktop hidden lg:flex'>
        <div className='stereo-glass-pill'>
          <Link href='/store'>Shop</Link>
          <a href='#philosophy'>Philosophy</a>
          <a href='#custom-builds'>Custom Builds</a>
          <a href='#maker'>Meet David</a>
        </div>

        <Link href='/' className='stereo-center-logo' aria-label='DCHOI DESIGNS'>
          DCHOI<span>/</span>DESIGNS
        </Link>

        <div className='stereo-glass-pill'>
          <Link href='/admin' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Studio Admin <ArrowUpRight size={12} />
          </Link>
          <Link href='/store'>Bag (0)</Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. FLOATING HEADER (MOBILE)                                         */}
      {/* ------------------------------------------------------------------- */}
      <header className='stereo-header-mobile flex lg:hidden'>
        <Link href='/' style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          DCHOI<span>/</span>DESIGNS
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Bag (0)
          </Link>
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label='Toggle menu'
            style={{ background: 'none', border: 0, padding: '4px', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: '64px 12px 12px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            zIndex: 899,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <Link
              href='/store'
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Catalog & Shop ↗
            </Link>
            <a
              href='#philosophy'
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Philosophy
            </a>
            <a
              href='#custom-builds'
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Custom Builds
            </a>
            <a
              href='#maker'
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Meet David Choi
            </a>
            <Link
              href='/admin'
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Studio Admin Portal ↗
            </Link>
          </nav>
          <div style={{ fontSize: '11px', color: '#76746e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Chicago Studio · 41°53&apos;N 87°38&apos;W
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. HERO SPLASH (STEREOSCOPE EDITORIAL FULLSCREEN)                   */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-hero-section'>
        <div className='stereo-hero-centerpiece'>
          <p className='stereo-hero-tagline'>
            41°53&apos;N 87°38&apos;W · CHICAGO, IL — SMALL BATCH WOODWORK
          </p>

          <h1 className='stereo-hero-heading'>
            Pursuit of depth
            <br />
            and simplicity
            <br />
            <em>in wood, in life.</em>
          </h1>

          <p className='stereo-hero-desc'>
            Hand-crafted knife sayas, end-grain cutting boards, and custom architectural furniture by David Choi.
            Made slowly from American hardwoods and Japanese magnolia.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href='/store' className='stereo-outline-btn'>
              Explore Shop Pieces <ArrowUpRight size={14} />
            </Link>
            <a href='#philosophy' className='stereo-outline-btn' style={{ background: '#1d1d1b', color: '#ffffff' }}>
              The Five Elements
            </a>
          </div>
        </div>

        <div className='stereo-hero-scroll-cue'>
          <span>Scroll to explore</span>
          <span>↓</span>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. STATEMENT BAR                                                    */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-statement-bar'>
        <p className='stereo-statement-text'>
          &ldquo;Every piece of timber holds a century of weather. Our calling is not to dominate the wood, but to reveal its voice.&rdquo;
        </p>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. THE FIVE ELEMENTS (SPLIT GRID MODULE)                            */}
      {/* ------------------------------------------------------------------- */}
      <section id='philosophy' className='stereo-grid-split'>
        <div
          className='stereo-media-half'
          style={{
            backgroundImage:
              "url('https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=1500w')",
          }}
        />

        <div className='stereo-copy-half'>
          <div>
            <p className='stereo-section-tag'>01 / Studio Philosophy</p>
            <h2 className='stereo-copy-heading'>
              The Five Elements of Craft:
              <br />
              Grain, Moisture, Steel, Fire &amp; Carver.
            </h2>
            <p className='stereo-copy-prose'>
              At the heart of DCHOI DESIGNS’ philosophy, the Five Elements represent a living dialogue between raw nature and human touch.
              {'\n\n'}
              We treat timber not as commercial lumber, but as an organic organism harvested with reverence. Every knife saya is hand-scribed to the exact bevel of your blade, planed with Japanese kanna to a friction-fit tolerance, and pinned with hand-carved ebony.
              {'\n\n'}
              This becomes our lens to explore depth, quiet utility, and heirloom permanence in daily kitchen rituals.
            </p>
          </div>

          <div>
            <Link href='/store' className='stereo-outline-btn'>
              View Studio Works <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 6. 12-COLUMN NARRATIVE: "WOOD AS LIFE"                             */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-12col-row' style={{ padding: '64px 24px', alignItems: 'center' }}>
        <div style={{ gridColumn: 'span 5', paddingRight: '24px' }}>
          <p className='stereo-section-tag'>02 / Craftsmanship &amp; Heritage</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 38px)', textTransform: 'uppercase', lineHeight: 1.15, margin: '0 0 24px' }}>
            Wood as Life:
            <br />
            The Grain, the Edge,
            <br />
            and the Spirit.
          </h2>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#55534e', margin: '0 0 32px' }}>
            DCHOI DESIGNS was established in Chicago by designer-woodworker David Choi. What began as a pursuit to build the ideal friction-fitted sheath for high-carbon Japanese chef knives evolved into a full custom studio creating heirloom furniture, end-grain cutting blocks, and bespoke residential millwork.
          </p>
          <a href='#maker' className='stereo-outline-btn'>
            Meet David Choi <ArrowUpRight size={14} />
          </a>
        </div>

        <div style={{ gridColumn: 'span 7', marginTop: '24px' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '16/10',
              backgroundImage:
                "url('https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1600&q=85')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '2px',
            }}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 7. "NEW RELEASE" CATALOG SECTION (STEREOSCOPE LAYOUT)               */}
      {/* ------------------------------------------------------------------- */}
      <section id='store' className='stereo-releases-wrap'>
        <div className='stereo-releases-header'>
          <div>
            <p className='stereo-section-tag'>03 / Small Batch Releases</p>
            <h2>Current Studio Releases</h2>
          </div>
          <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'underline' }}>
            View Full Inventory ↗
          </Link>
        </div>

        <div className='stereo-releases-grid'>
          {/* Featured Hero Product Card */}
          <Link href={`/products/${featuredProduct.id}`} className='stereo-hero-product-card'>
            <p className='stereo-hero-product-badge'>Featured Release</p>
            <div
              className='stereo-hero-product-img'
              style={{ backgroundImage: `url('${featuredProduct.image}')` }}
            />
            <div>
              <h3 className='stereo-hero-product-name'>{featuredProduct.name}</h3>
              <div className='stereo-hero-product-price'>
                FROM ${featuredProduct.price.toFixed(2)} · {featuredProduct.woodType || 'Japanese Magnolia'}
              </div>
            </div>
          </Link>

          {/* Secondary 2-Column Catalog Subgrid */}
          <div className='stereo-product-subgrid'>
            {catalogPieces.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className='stereo-small-product-card'>
                <div
                  className='stereo-small-product-img'
                  style={{ backgroundImage: `url('${p.image}')` }}
                />
                <h4 className='stereo-small-product-title'>{p.name}</h4>
                <p className='stereo-small-product-price'>${p.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 8. COLLABORATIVE & AWARDS GRID (STEREOSCOPE BORDERED GRID)          */}
      {/* ------------------------------------------------------------------- */}
      <section id='custom-builds' className='stereo-collab-grid'>
        {/* Cell 1: Newsletter */}
        <div className='stereo-collab-cell'>
          <div>
            <p className='stereo-section-tag'>Studio Gazette</p>
            <h3 style={{ fontSize: '18px', textTransform: 'uppercase', margin: '0 0 16px' }}>
              Subscribe to Batch Drops
            </h3>
            <p style={{ fontSize: '12.5px', color: '#66635d', lineHeight: 1.6, marginBottom: '24px' }}>
              Sign up for notifications on raw lumber arrivals, newly finished knife sayas, and annual custom furniture reservation windows.
            </p>
          </div>

          {newsletterSubscribed ? (
            <div
              style={{
                background: '#eaf4ee',
                border: '1px solid #c8e2d0',
                padding: '12px',
                borderRadius: '2px',
                fontSize: '12px',
                color: '#2e5b3c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Check size={16} /> Thank you. You are on the DCHOI studio dispatch list.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterSubscribed(true);
              }}
            >
              <input
                type='email'
                className='stereo-underline-input'
                placeholder='Enter your email address'
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <div style={{ margin: '14px 0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type='checkbox' id='consent' required style={{ margin: 0 }} />
                <label htmlFor='consent' style={{ fontSize: '11px', color: '#76746e', margin: 0 }}>
                  I agree to receive handcrafted batch updates.
                </label>
              </div>
              <button type='submit' className='stereo-solid-btn'>
                Subscribe to Drops
              </button>
            </form>
          )}
        </div>

        {/* Cell 2: Commissions & Stockists */}
        <div className='stereo-collab-cell' style={{ gap: '28px' }}>
          <div>
            <p className='stereo-section-tag'>Bespoke Commissions</p>
            <h3 style={{ fontSize: '18px', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Custom Furniture &amp; Chef Builds
            </h3>
            <p style={{ fontSize: '12.5px', color: '#66635d', lineHeight: 1.6, marginBottom: '14px' }}>
              We collaborate with private collectors, culinary knife shops, and restaurants on bespoke walnut storage, slatted tables, and personalized saya sheaths.
            </p>
            <a
              href='mailto:David@dchoidesigns.com?subject=Custom Build Inquiry'
              style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'underline', fontWeight: 600 }}
            >
              Start a custom project ↗
            </a>
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '20px' }}>
            <p className='stereo-section-tag'>Studio Visits</p>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Chicago Workshop Showroom
            </h4>
            <p style={{ fontSize: '12px', color: '#66635d' }}>
              1420 N Damen Ave, Chicago, IL 60622 · By appointment
            </p>
            <a
              href='mailto:David@dchoidesigns.com?subject=Studio Visit Request'
              style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'underline' }}
            >
              Schedule consultation ↗
            </a>
          </div>
        </div>

        {/* Cell 3: Recognition & Awards */}
        <div className='stereo-collab-cell'>
          <p className='stereo-section-tag'>Recognition</p>
          <h3 style={{ fontSize: '18px', textTransform: 'uppercase', margin: '0 0 18px' }}>
            Selected Guild Honors &amp; Features
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
              <span>2024, American Craft Council</span>
              <strong style={{ fontWeight: 600 }}>Studio Feature</strong>
            </li>
            <li style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
              <span>2023, Culinary Toolmakers Invitational</span>
              <strong style={{ fontWeight: 600 }}>Gold Medal</strong>
            </li>
            <li style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
              <span>2023, Chicago Fine Woodworking Guild</span>
              <strong style={{ fontWeight: 600 }}>Master Citation</strong>
            </li>
            <li style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
              <span>2022, Dieline Craft Packaging</span>
              <strong style={{ fontWeight: 600 }}>Shortlisted</strong>
            </li>
          </ul>
        </div>

        {/* Cell 4: Meet David */}
        <div id='maker' className='stereo-collab-cell'>
          <p className='stereo-section-tag'>04 / The Maker</p>
          <h3 style={{ fontSize: '18px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            David Choi
          </h3>
          <p style={{ fontSize: '13px', color: '#55534e', lineHeight: 1.6, marginBottom: '20px' }}>
            &ldquo;I believe every object we interact with in the kitchen or home should carry weight, story, and tactile satisfaction. I make pieces meant to outlast us.&rdquo;
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href='mailto:David@dchoidesigns.com' className='stereo-outline-btn'>
              Write to David <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 9. SOCIAL MEDIA FANDECK (SIGNATURE STEREOSCOPE HORIZONTAL CASCADE)  */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-social-section'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <p className='stereo-section-tag'>Visual Journal</p>
            <h2 style={{ fontSize: '20px', textTransform: 'uppercase', margin: 0 }}>
              Live from the Studio
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#76746e', margin: 0 }}>
            Follow @dchoidesigns for daily grain selections
          </p>
        </div>

        <div className='stereo-fandeck-track'>
          {socialPhotos.map((item, idx) => (
            <div
              key={idx}
              className='stereo-fandeck-card'
              style={{ backgroundImage: `url('${item.img}')` }}
              title={item.title}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 10. ARCHITECTURAL DUAL-TIMEZONE FOOTER                              */}
      {/* ------------------------------------------------------------------- */}
      <footer className='stereo-footer-grid'>
        {/* Left: Dual Timezone Clocks */}
        <div style={{ gridColumn: 'span 6', padding: '48px 32px', borderRight: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px' }}>
          <div>
            <p className='stereo-section-tag'>Live Studio Telemetry</p>
            <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                  CHICAGO STUDIO
                </span>
                <span className='stereo-footer-clock' style={{ fontSize: '18px', fontWeight: 600 }}>
                  {chicagoTime || '12:00:00'}
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#22c55e', marginTop: '4px' }}>
                  ● WORKSHOP OPEN
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                  TOKYO PARTNER
                </span>
                <span className='stereo-footer-clock' style={{ fontSize: '18px', fontWeight: 600 }}>
                  {tokyoTime || '02:00:00'}
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#76746e', marginTop: '4px' }}>
                  LUMBER HARVEST
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#66635d', lineHeight: 1.6 }}>
            DCHOI DESIGNS STUDIO<br />
            1420 N Damen Ave, Chicago, IL 60622<br />
            Inquiries: David@dchoidesigns.com
          </div>
        </div>

        {/* Right: Navigation, Hours & Status */}
        <div style={{ gridColumn: 'span 6', padding: '48px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p className='stereo-section-tag'>Navigation</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', textTransform: 'uppercase' }}>
                <li><Link href='/store'>Shop Pieces</Link></li>
                <li><a href='#custom-builds'>Custom Builds</a></li>
                <li><a href='#philosophy'>Philosophy</a></li>
                <li><Link href='/admin'>Admin Studio ↗</Link></li>
              </ul>
            </div>

            <div>
              <p className='stereo-section-tag'>Studio Hours</p>
              <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#1d1d1b', marginTop: '8px' }}>
                Mon &ndash; Fri: 9:00am &ndash; 6:00pm CST<br />
                Sat: 10:00am &ndash; 4:00pm CST<br />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span className='stereo-open-dot' />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                    Showroom Open
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#76746e', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
            <span>© {new Date().getFullYear()} DCHOI DESIGNS. All rights reserved.</span>
            <span>Made slowly in Chicago.</span>
          </div>
        </div>

        {/* Giant Typographical Architectural Wordmark Banner */}
        <div style={{ gridColumn: 'span 12' }} className='stereo-footer-giant-wordmark'>
          <svg viewBox='0 0 1200 120' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ width: '100%', height: 'auto', display: 'block' }}>
            <text
              x='50%'
              y='95'
              textAnchor='middle'
              fill='#1d1d1b'
              fontSize='108'
              fontWeight='900'
              letterSpacing='12'
              fontFamily='system-ui, -apple-system, sans-serif'
            >
              DCHOI DESIGNS
            </text>
          </svg>
        </div>
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* 11. SIGNATURE FLOATING STUDIO AMBIENT AUDIO BAR                     */}
      {/* ------------------------------------------------------------------- */}
      <div className='stereo-audio-player-fixed'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type='button'
            onClick={toggleStudioAudio}
            aria-label={isPlayingAudio ? 'Pause studio ambience' : 'Play studio ambience'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1d1d1b',
              color: '#ffffff',
              border: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isPlayingAudio ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
          </button>

          <div>
            <strong style={{ fontSize: '12px', display: 'block', color: '#1d1d1b' }}>
              I am, we are, you.
            </strong>
            <span style={{ fontSize: '10px', color: '#76746e' }}>
              {isPlayingAudio ? 'Acoustic Wood Resonance · 432Hz' : 'DCHOI Studio Atmosphere, Chicago'}
            </span>
          </div>
        </div>

        {/* Soundwave animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className='stereo-soundwave-bars'>
            <span className={`stereo-wave-bar ${isPlayingAudio ? 'playing' : ''}`} style={{ height: '10px' }} />
            <span className={`stereo-wave-bar ${isPlayingAudio ? 'playing' : ''}`} style={{ height: '16px' }} />
            <span className={`stereo-wave-bar ${isPlayingAudio ? 'playing' : ''}`} style={{ height: '8px' }} />
            <span className={`stereo-wave-bar ${isPlayingAudio ? 'playing' : ''}`} style={{ height: '14px' }} />
            <span className={`stereo-wave-bar ${isPlayingAudio ? 'playing' : ''}`} style={{ height: '6px' }} />
          </div>

          <button
            type='button'
            onClick={toggleMute}
            aria-label='Toggle sound'
            style={{ background: 'none', border: 0, color: '#1d1d1b', cursor: 'pointer', padding: '4px' }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

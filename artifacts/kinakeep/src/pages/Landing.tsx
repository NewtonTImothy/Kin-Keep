import React from 'react';
import { useAuth } from '@workspace/replit-auth-web';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Receipt, PieChart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // All hooks must be called unconditionally before any early returns
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/app/dashboard');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="KinaKeep" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-xl text-primary tracking-tight">KinaKeep</span>
        </div>
        <Button onClick={login} size="sm" variant="outline" className="font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
          Log in
        </Button>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative px-5 pt-16 pb-14 md:pt-20 md:pb-16 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Mobile-only kina note background */}
          <div className="md:hidden absolute inset-0 -mx-5 overflow-hidden pointer-events-none" aria-hidden="true">
            <img
              src="/kina-note.png"
              alt=""
              className="w-full h-full object-cover object-center scale-110"
            />
            {/* gradient overlay — light at bottom so text breathes, tinted at top */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/88 via-background/80 to-background/95" />
          </div>
          {/* All hero content — above the absolute bg */}
          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Logo mark */}
            <div className="mb-6">
              <img src="/logo.png" alt="" className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto drop-shadow-lg" />
            </div>

            {/* Badge */}
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs font-semibold tracking-wide uppercase mb-5 backdrop-blur-sm">
              Built for PNG Small Businesses
            </span>

            {/* Headline */}
            <h1 className="font-display font-bold text-[2.2rem] leading-tight md:text-6xl text-primary tracking-tight mb-5 drop-shadow-sm">
              Every Kina.<br />Accounted For.
            </h1>

            {/* One-liner sub */}
            <p className="text-base md:text-lg text-foreground/70 max-w-md mb-8 leading-relaxed">
              Your digital cashbook — record sales, expenses, and receipts from any phone, instantly.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={login}
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={login}
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto h-12 px-6 text-base text-muted-foreground hover:text-primary rounded-full"
              >
                Log in to my account
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-5 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { icon: BookOpen,  title: 'Record Transactions', body: 'Log every sale and purchase in seconds — no paper, no pens.' },
              { icon: Receipt,   title: 'Capture Receipts',    body: 'Snap a photo and attach it to any expense. Ready for tax time.' },
              { icon: PieChart,  title: 'See Your Profits',    body: 'Instant charts show where money comes in and where it goes.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                <p className="text-primary-foreground/75 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-16 md:py-20 bg-card border-y border-border">
          <div className="max-w-5xl mx-auto px-5">
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-primary mb-2">Simple as 1, 2, 3</h2>
              <p className="text-sm text-muted-foreground">No accounting degree. No training needed.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { step: '1', title: 'Add Your Business',    desc: 'Set up in under a minute — just your business name.' },
                { step: '2', title: 'Log Money In & Out',   desc: 'Record every sale and purchase as it happens.' },
                { step: '3', title: 'Read Your Reports',    desc: 'Balances and charts are built for you automatically.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="relative bg-background rounded-2xl p-6 border border-border overflow-hidden">
                  <span className="absolute right-3 top-2 text-7xl font-display font-black text-muted/20 select-none leading-none">{step}</span>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Step {step}</p>
                  <h4 className="font-display font-bold text-base text-foreground mb-1 relative z-10">{title}</h4>
                  <p className="text-sm text-muted-foreground relative z-10 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust ── */}
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-xl mx-auto px-5 text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">Your Data is Safe</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Stored securely in the cloud. Unlike a paper notebook, your records can never be lost, damaged, or stolen.
            </p>
            <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {['Auto-saved', 'Any device', 'Private to you'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="py-16 md:py-20 bg-primary text-center px-5">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-foreground mb-3">
            Ready to take control?
          </h2>
          <p className="text-sm text-primary-foreground/75 mb-8 max-w-sm mx-auto">
            Join PNG business owners who keep every kina accounted for.
          </p>
          <Button
            onClick={login}
            size="lg"
            variant="secondary"
            className="h-12 px-8 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Create Free Account
          </Button>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-background/70 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="KinaKeep" className="w-6 h-6 object-contain brightness-0 invert" />
            <span className="font-display font-bold text-background">KinaKeep</span>
          </div>
          <p className="text-xs text-background/50 text-center max-w-xs">
            A record-keeping tool. Consult a qualified accountant for formal tax advice in Papua New Guinea.
          </p>
        </div>
      </footer>

    </div>
  );
}

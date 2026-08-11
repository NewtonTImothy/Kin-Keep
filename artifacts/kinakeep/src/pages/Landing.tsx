import React from 'react';
import { useAuth } from '@workspace/replit-auth-web';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, PieChart, Receipt, BookOpen, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (isAuthenticated) {
    setLocation('/app/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
            K
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-primary">KinaKeep</span>
        </div>
        <Button onClick={login} variant="ghost" className="font-semibold text-primary">Log in</Button>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground font-semibold text-sm mb-6">
            Built for PNG SMEs
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-tight mb-6 leading-tight">
            Keep Every Kina <br className="hidden md:block"/> Accounted For.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
            A simple digital notebook for your business money. Whether you run a trade store, market stall, or a contracting business, KinaKeep helps you track exactly what comes in and what goes out.
          </p>
          <Button onClick={login} size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </section>

        {/* Value Props / Features */}
        <section className="bg-primary text-primary-foreground py-24">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-display font-semibold">Record Every Transaction</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                Replace your paper notebook. Log sales and expenses in seconds from your phone, and never lose track of a single toea.
              </p>
            </div>
            
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                <Receipt className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-display font-semibold">Keep Every Receipt</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                Snap a photo of your receipts and attach them directly to your expenses. Tax time becomes simple when everything is documented.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                <PieChart className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-display font-semibold">Understand Your Business</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                See instantly if you are making a profit. Clear charts show exactly where your money comes from and where it is going.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-primary mb-4">Simple as 1, 2, 3</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">No accounting degree required. If you can use a smartphone, you can use KinaKeep.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Add Your Business", desc: "Create your profile in 60 seconds with just your business name." },
                { step: "2", title: "Log Money In & Out", desc: "Record every sale and purchase as it happens with clear, big buttons." },
                { step: "3", title: "See The Big Picture", desc: "Let KinaKeep calculate your balances and build your reports automatically." }
              ].map((s, i) => (
                <div key={i} className="bg-background rounded-2xl p-8 border border-border shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-9xl font-display font-black text-muted/30 group-hover:text-primary/5 transition-colors pointer-events-none select-none">
                    {s.step}
                  </div>
                  <h4 className="text-2xl font-display font-bold text-foreground mb-3 relative z-10">{s.title}</h4>
                  <p className="text-muted-foreground relative z-10">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust/Security */}
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">Your Data is Secure</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Unlike a physical notebook that can be lost, damaged, or stolen, your records on KinaKeep are securely stored in the cloud. Access your business from any device, anytime.
            </p>
            <ul className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="h-5 w-5 text-secondary" /> Auto-saved constantly</li>
              <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="h-5 w-5 text-secondary" /> Access anywhere</li>
              <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="h-5 w-5 text-secondary" /> Private to you</li>
            </ul>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 bg-primary text-center px-6">
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-6">Ready to take control?</h2>
          <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Start Keeping Your Business Records today and set your SME up for success.
          </p>
          <Button onClick={login} size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold rounded-full shadow-lg hover:bg-secondary/90 text-secondary-foreground transition-all">
            Create Free Account
          </Button>
        </section>
      </main>

      <footer className="bg-foreground text-background/80 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              K
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-background">KinaKeep</span>
          </div>
          <p className="text-sm">A simple digital notebook for your business money.</p>
          <p className="text-xs text-background/50 max-w-xs text-center md:text-right">
            Disclaimer: KinaKeep is a record-keeping tool. Consult a qualified accountant for formal tax requirements in Papua New Guinea.
          </p>
        </div>
      </footer>
    </div>
  );
}

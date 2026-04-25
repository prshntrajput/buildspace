import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Target, Users } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-lg">BuildSpace</span>
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <Button variant="ghost" size="sm">Browse</Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">Execution-first platform</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          Build in Public.<br />
          <span className="text-primary">Ship with Proof.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop collecting ideas. Start shipping products. BuildSpace holds you accountable
          with an Execution Score that reflects your actual output — not your intentions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/ideas">
            <Button size="lg" variant="outline">
              Browse Ideas
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Share your idea</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Post your idea with structured context — the problem, target user, solution, and MVP plan.
              AI validates it for clarity and market signal instantly.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Execute in public</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Open a Build Room. Complete tasks with proof. Post weekly updates.
              Ship milestones. Every action builds your Execution Score — a real measure of output.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Build with others</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Post open roles. Attract skilled builders based on their execution history, not just their résumé.
              Teams form around actual momentum.
            </p>
          </div>
        </div>
      </section>

      {/* Execution Score callout */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">The Execution Score</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            Every task closed with proof, every weekly update, every milestone verified by peers —
            all decay-weighted over time. Your score reflects what you&apos;ve shipped, not just what you&apos;ve planned.
            Inactivity decays it. Shipping restores it.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {["Bronze", "Silver", "Gold", "Platinum"].map((rank) => (
              <Badge
                key={rank}
                variant={rank.toLowerCase() as "bronze" | "silver" | "gold" | "platinum"}
                className="text-sm px-4 py-1"
              >
                {rank}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to stop planning and start shipping?</h2>
        <p className="text-muted-foreground mb-8">Join builders who execute in public.</p>
        <Link href="/login">
          <Button size="lg" className="gap-2">
            Create Your Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} BuildSpace. Build in public, ship with proof.</p>
      </footer>
    </div>
  );
}

import Link from 'next/link'

export const metadata = {
  title: 'Rules — Fantasy Baseball 2026',
}

export default function RulesPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
        <div className="mb-12 reveal" style={{ '--delay': 0 } as React.CSSProperties}>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-navy tracking-tight">
            Rules
          </h1>
          <p className="text-ink-secondary mt-2 text-sm sm:text-base">Everything you need to know</p>
        </div>

        <div className="space-y-12 reveal" style={{ '--delay': 1 } as React.CSSProperties}>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">How It Works</h2>
            <div className="space-y-3 text-ink-secondary text-sm sm:text-base leading-relaxed">
              <p>Each team picks <strong className="text-ink">one player per position group</strong>. There are 9 positions &mdash; C, 1B, 2B, 3B, SS, OF, DH, SP, and RP &mdash; and each position has multiple groups to choose from.</p>
              <p>Once you pick a player from a group, that group is locked for you. Other managers can still pick from the same group, but each individual player can only be claimed by one team.</p>
              <p>Points accumulate throughout the 2026 MLB season based on real stats.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">Scoring</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="scorecard bg-surface p-5">
                <p className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-3">Hitters</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Hit</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Run</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Home Run</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">RBI</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-ink-secondary">Stolen Base</td>
                      <td className="py-2 text-right font-display font-semibold text-crimson">2 pts</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="scorecard bg-surface p-5">
                <p className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-3">Pitchers</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Out Recorded</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Strikeout</td>
                      <td className="py-2 text-right font-display font-semibold text-navy">1 pt</td>
                    </tr>
                    <tr className="border-b border-navy/5">
                      <td className="py-2 text-ink-secondary">Win</td>
                      <td className="py-2 text-right font-display font-semibold text-crimson">4 pts</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-ink-secondary">Save</td>
                      <td className="py-2 text-right font-display font-semibold text-crimson">5 pts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">All-Star Break Swaps</h2>
            <p className="text-ink-secondary text-sm sm:text-base leading-relaxed">
              During the All-Star break, a swap window opens. You get <strong className="text-ink">4 swaps</strong> &mdash; drop a player from your roster and pick a new one from the available pool. Use them wisely, this is your only chance to adjust mid-season.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">How Stats Stack</h2>
            <div className="space-y-3 text-ink-secondary text-sm sm:text-base leading-relaxed">
              <p><strong className="text-ink">Solo home run</strong> = Hit + Home Run + Run + RBI = <strong className="text-crimson">4 pts</strong></p>
              <p><strong className="text-ink">Strikeout</strong> = Out + Strikeout = <strong className="text-crimson">2 pts</strong> (every K counts double!)</p>
              <p><strong className="text-ink">7-inning start with 8 K&rsquo;s and a win</strong> = 21 outs + 8 K&rsquo;s + win = <strong className="text-crimson">33 pts</strong></p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-4">Tips</h2>
            <ul className="space-y-2 text-ink-secondary text-sm sm:text-base leading-relaxed">
              <li><strong className="text-ink">Games played matters most</strong> &mdash; a healthy player who plays 150+ games will outscore a better player who misses time.</li>
              <li><strong className="text-ink">Stolen bases are premium</strong> &mdash; worth 2 pts each. Speedsters punch above their weight.</li>
              <li><strong className="text-ink">Every out counts for pitchers</strong> &mdash; a workhorse who throws 200 innings records 600 outs. Add strikeouts on top of that.</li>
              <li><strong className="text-ink">Saves are the biggest single play</strong> &mdash; 5 pts each. A closer with 30+ saves banks 150+ bonus points.</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-navy/8 reveal" style={{ '--delay': 2 } as React.CSSProperties}>
          <Link href="/select" className="inline-block bg-crimson text-white font-medium px-5 py-2.5 rounded-lg hover:bg-crimson-light transition-colors focus-ring">
            Pick your team →
          </Link>
        </div>
      </div>
    </main>
  )
}

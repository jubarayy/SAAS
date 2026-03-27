export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white font-bold text-sm">M</div>
          <span className="text-white font-semibold text-lg">MarkupFlow</span>
        </div>
        <div>
          <blockquote className="text-white/90 text-xl font-light leading-relaxed">
            "Stop chasing clients for feedback. MarkupFlow gives them a simple way to click, comment, and approve — in one place."
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/30" />
            <div>
              <p className="text-white text-sm font-medium">Sarah Chen</p>
              <p className="text-white/60 text-xs">Freelance Web Designer</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[["3min", "avg. client response"], ["94%", "approval on first round"], ["0", "email chains needed"]].map(([stat, label]) => (
            <div key={stat} className="rounded-lg bg-white/10 p-4">
              <div className="text-2xl font-bold text-white">{stat}</div>
              <div className="text-xs text-white/60 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">M</div>
            <span className="font-semibold">MarkupFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

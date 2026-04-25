export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">BuildSpace</h1>
          <p className="text-muted-foreground text-sm mt-1">Set up your profile to get started</p>
        </div>
        {children}
      </div>
    </div>
  );
}

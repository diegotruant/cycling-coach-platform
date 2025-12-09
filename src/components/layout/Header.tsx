export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    CO
                </div>
            </div>
        </header>
    );
}

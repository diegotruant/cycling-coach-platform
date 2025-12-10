import { Activity, Users, Calendar, Settings } from "lucide-react";
import Link from "next/link";

import { SplashScreen } from "@/components/SplashScreen";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <SplashScreen />
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-border bg-card pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-card lg:p-4">
          Cycling Coach Platform &nbsp;
          <code className="font-mono font-bold text-primary">v0.1</code>
        </p>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-primary before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-secondary after:via-primary after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-primary before:dark:opacity-10 after:dark:from-secondary after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1] flex-col gap-8">
        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl text-center">
          Serious <span className="text-primary">Sport</span>
        </h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/coach" className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 text-center">
            Coach Dashboard
          </Link>
          <Link href="/athlete/login" className="rounded-full bg-secondary px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-secondary/90 text-center">
            Athlete Login
          </Link>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left mt-20 gap-4">
        <Link
          href="/coach/athletes"
          className="group rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary hover:bg-card/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Users className="w-6 h-6 text-primary" />
            Athletes
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Manage your roster and track progress.
          </p>
        </Link>

        <Link
          href="/coach/workouts"
          className="group rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary hover:bg-card/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Activity className="w-6 h-6 text-secondary" />
            Workouts
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Create and assign training sessions.
          </p>
        </Link>

        <Link
          href="/coach/schedule"
          className="group rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary hover:bg-card/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Calendar className="w-6 h-6 text-primary" />
            Schedule
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Plan the season with drag-and-drop.
          </p>
        </Link>

        <Link
          href="/coach/settings"
          className="group rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary hover:bg-card/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Settings className="w-6 h-6 text-muted-foreground" />
            Settings
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Configure platform preferences.
          </p>
        </Link>
      </div>
    </main>
  );
}

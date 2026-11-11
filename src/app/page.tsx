import Analyzer from "@/components/Analyzer";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Job Match Analyzer
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Paste a job description and your resume to see how well they match and what to improve.
        </p>
      </header>

      <Analyzer />
    </main>
  );
}

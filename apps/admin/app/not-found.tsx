import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-muted-foreground">That page or record does not exist.</p>
      <Link href="/" className="text-primary hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}

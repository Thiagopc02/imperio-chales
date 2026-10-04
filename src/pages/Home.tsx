import Header from "../layout/Header";
import { Hero } from "../components/hero/Hero";
import { AtrativosChapada } from "../components/AtrativosChapada";

export function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <Hero />

      <AtrativosChapada />
    </main>
  );
}
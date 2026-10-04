import Header from "../layout/Header";
import { Hero } from "../components/hero/Hero";
import { AtrativosChapada } from "../components/AtrativosChapada";
import { Footer } from "../components/Footer";

export function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <Hero />

      <AtrativosChapada />

      <Footer />
    </main>
  );
}
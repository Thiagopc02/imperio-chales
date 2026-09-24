import Header from "../layout/Header";
import { Hero } from "../components/Hero";
import { About } from "../components/About";

export function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />
      <Hero />
      <About />
    </main>
  );
}
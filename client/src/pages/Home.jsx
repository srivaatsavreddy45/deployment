import "../styles/ssfHome.css";

import Navbar from "../components/ssf/Navbar";
import Hero from "../components/ssf/Hero";
import ImpactStats from "../components/ssf/ImpactStats";
import AboutSection from "../components/ssf/AboutSection";
import ProgramsSection from "../components/ssf/ProgramsSection";
import StoriesSection from "../components/ssf/StoriesSection";
import GetInvolvedSection from "../components/ssf/GetInvolvedSection";
import Footer from "../components/ssf/Footer";

export default function Home() {
  return (
    <div className="ssf-root">
      <Navbar />
      <main>
        <Hero />
        <ImpactStats />
        <AboutSection />
        <ProgramsSection />
        <StoriesSection />
        <GetInvolvedSection />
      </main>
      <Footer />
    </div>
  );
}

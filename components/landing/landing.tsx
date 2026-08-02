"use client";

import { useState } from "react";
import { LandingNav } from "./nav";
import { Hero } from "./hero";
import { LogosMarquee } from "./logos";
import { Problem } from "./problem";
import { HowItWorks } from "./how";
import { Features } from "./features";
import { Schedule7 } from "./schedule7";
import { Pricing } from "./pricing";
import { Testimonials } from "./testimonials";
import { CtaBanner } from "./cta";
import { Footer } from "./footer";
import { Language } from "@/lib/types";

export function LandingPage() {
  const [lang, setLang] = useState<Language>("en");
  return (
    <>
      <LandingNav lang={lang} setLang={setLang} />
      <main>
        <Hero lang={lang} />
        <LogosMarquee />
        <Problem />
        <HowItWorks />
        <Features />
        <Schedule7 />
        <Pricing />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer lang={lang} />
    </>
  );
}

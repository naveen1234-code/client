"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeGalleryPreview from "@/components/HomeGalleryPreview";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
const [loadingProgress, setLoadingProgress] = useState(0);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [scrolled, setScrolled] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
  const elements = document.querySelectorAll(".motion-fade-up");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    },
    { threshold: 0.18 }
  );

  elements.forEach((el) => observer.observe(el));

  let progress = 0;

  const progressTimer = setInterval(() => {
    progress += Math.random() * 18;

    if (progress >= 100) {
      progress = 100;
      setLoadingProgress(100);

      clearInterval(progressTimer);

      setTimeout(() => {
        setLoading(false);
      }, 250);
    } else {
      setLoadingProgress(Math.floor(progress));
    }
  }, 180);

  return () => {
    observer.disconnect();
    clearInterval(progressTimer);
  };
}, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  return (
    <>
      {/* CINEMATIC INTRO */}
<div
  className={`fixed inset-0 z-[999] overflow-hidden bg-black transition-all duration-700 ${
    loading
      ? "visible opacity-100"
      : "invisible pointer-events-none opacity-0"
  }`}
>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_30%),linear-gradient(180deg,#020202_0%,#090909_50%,#030303_100%)]" />

<div className="absolute inset-0 overflow-hidden">
  <div className="absolute -left-16 top-0 h-[260px] w-[260px] rounded-full bg-red-600/12 blur-3xl animate-[pulseRedBgSoft_5s_ease-in-out_infinite]" />
  <div className="absolute right-[-60px] bottom-[-40px] h-[240px] w-[240px] rounded-full bg-red-500/10 blur-3xl animate-[pulseRedBgSoft_6.5s_ease-in-out_infinite]" />
</div>

<div className="absolute inset-0 overflow-hidden">
  <div className="absolute left-[-12%] top-[65%] h-[3px] w-[65%] rotate-[-32deg] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-90 blur-[1px] animate-[streakBlue_3.8s_linear_infinite]" />
  <div className="absolute left-[-18%] top-[72%] h-[2px] w-[58%] rotate-[-32deg] rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70 blur-[1px] animate-[streakBlue_4.5s_linear_infinite]" />
  <div className="absolute left-[40%] top-[22%] h-[3px] w-[62%] rotate-[-32deg] rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-95 blur-[1px] animate-[streakRed_4s_linear_infinite]" />
  <div className="absolute left-[48%] top-[30%] h-[2px] w-[54%] rotate-[-32deg] rounded-full bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-80 blur-[1px] animate-[streakRed_5s_linear_infinite]" />

  <div className="absolute left-[-8%] top-[55%] h-[220px] w-[220px] rounded-full bg-blue-500/12 blur-3xl animate-[pulseBlueBg_4s_ease-in-out_infinite]" />
  <div className="absolute right-[-6%] top-[12%] h-[220px] w-[220px] rounded-full bg-red-500/12 blur-3xl animate-[pulseRedBg_4s_ease-in-out_infinite]" />
</div>
  <div className="relative z-10 flex h-full items-center justify-center px-6">
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center gap-5 sm:gap-7">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl border border-red-900/40 bg-red-600/10 shadow-[0_0_45px_rgba(220,38,38,0.22)]">
          <img
            src="/gym-logo.png"
            alt="Gym Ravana Logo"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
        </div>

        <span className="text-2xl font-black text-white/75 sm:text-3xl">×</span>

        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl border border-blue-900/40 bg-blue-600/10 shadow-[0_0_45px_rgba(59,130,246,0.22)]">
          <img
            src="/zyverion-logo.png"
            alt="Zyverion Logo"
            className="h-11 w-11 object-contain sm:h-12 sm:w-12"
          />
        </div>
      </div>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.42em] text-red-500 animate-[fadeUp_0.8s_ease-out]">
        Warrior Performance Gym
      </p>

      <h1 className="mt-4 font-display text-4xl font-bold uppercase tracking-[0.28em] text-white md:text-6xl animate-[fadeUp_1s_ease-out]">
        GYM RAVANA
      </h1>

      <p className="mt-5 text-[11px] uppercase tracking-[0.35em] text-gray-400 animate-[fadeUp_1.15s_ease-out]">
        Strength • Discipline • Power
      </p>

      <div className="mx-auto mt-8 w-48 sm:w-56">
  <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-blue-500 transition-all duration-200"
      style={{ width: `${loadingProgress}%` }}
    />
  </div>

  <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-gray-500">
    Loading {loadingProgress}%
  </p>
</div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.34em] text-gray-500 animate-[fadeUp_1.2s_ease-out]">
        Powered by <span className="font-bold text-blue-400">ZYVERION</span>
      </p>
    </div>
  </div>
</div>

      <main id="top" className="bg-black text-white pt-[92px] overflow-x-hidden">
        {/* TOP STRIP */}
        <div className="fixed top-0 left-0 z-50 w-full border-b border-red-900/30 bg-gradient-to-r from-red-800 via-red-700 to-red-800">
          <div className="container-custom flex h-[28px] items-center justify-center px-4">
            <p className="text-center text-[9px] font-semibold uppercase tracking-[0.24em] text-white md:text-[10px]">
              Strength • Discipline • Power
            </p>
          </div>
        </div>

        {/* NAVBAR */}
<nav
  className={`fixed left-0 top-[28px] z-40 w-full border-b border-white/10 backdrop-blur-xl transition-all duration-300 ${
    scrolled
      ? "bg-black/95 shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
      : "bg-black/88 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
  }`}
>
  <div className="container-custom">
    <div
  className={`flex items-center justify-between gap-5 transition-all duration-300 ${
    scrolled ? "h-[56px]" : "h-[64px]"
  }`}
>
      {/* BRAND */}
      <a href="#top" className="group flex shrink-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-900/40 bg-red-600/10 shadow-[0_0_20px_rgba(220,38,38,0.10)]">
          <span className="font-display text-lg font-bold uppercase text-red-500">
            R
          </span>
        </div>

        <div className="leading-none">
          <p
  className={`font-display font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] text-red-600 transition-all group-hover:text-red-500 ${
  scrolled ? "text-[0.92rem] md:text-[1.35rem]" : "text-[1rem] md:text-[1.55rem]"
}`}
>
            GYM RAVANA
          </p>
          <p className="mt-1 hidden text-[8px] uppercase tracking-[0.22em] text-gray-400 md:block md:text-[9px]">
            Warrior Performance Gym
          </p>
        </div>
      </a>

      {/* DESKTOP MENU */}
      <div className="hidden xl:flex items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-200">
        <a href="#top" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          Home
        </a>
        <a href="#about" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          About
        </a>
        <a href="#why-ravana" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          Why Ravana
        </a>
        <a href="#plans" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          Plans
        </a>
        <a href="#schedule" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          Schedule
        </a>
        <a href="#contact" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
          Contact
        </a>

        <a href="/terms" className="relative pb-1 transition hover:text-red-500 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full">
  Terms
</a>
        
        


      </div>

      {/* RIGHT SIDE */}
      <div className="flex shrink-0 items-center gap-2">
  {!loading && !isLoggedIn ? (
    <>
      <a
        href="/login"
        className="hidden md:inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
      >
        Member Login
      </a>

      <a
        href="/register"
        className="hidden sm:inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_22px_rgba(220,38,38,0.22)] transition hover:bg-red-700"
      >
        Register
      </a>
    </>
  ) : (
    !loading && (
      <>
        <a
          href="/dashboard"
          className="hidden md:inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
        >
          Dashboard
        </a>

        <a
          href="/check-in"
          className="hidden sm:inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_22px_rgba(220,38,38,0.22)] transition hover:bg-red-700"
        >
          Check-In
        </a>

        <button
          onClick={handleLogout}
          className="hidden sm:inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
        >
          Logout
        </button>
      </>
    )
  )}

  
</div>
        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="inline-flex xl:hidden items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10"
          aria-label="Open mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
</nav>
{/* MOBILE MENU OVERLAY */}
<div
  className={`fixed inset-0 z-[80] xl:hidden transition-all duration-300 ${
    mobileMenuOpen
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0"
  }`}
>
  {/* BACKDROP */}
  <div
    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
    onClick={() => setMobileMenuOpen(false)}
  />

  {/* PANEL */}
  <div
    className={`absolute right-0 top-0 h-full w-[88%] max-w-[360px] border-l border-white/10 bg-[#090909] shadow-[0_20px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ${
      mobileMenuOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
      <div>
        <p className="font-display text-xl font-bold uppercase tracking-[0.12em] text-red-600">
          GYM RAVANA
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-gray-400">
          Warrior Performance Gym
        </p>
      </div>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(false)}
        className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
        aria-label="Close mobile menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>
    </div>

    <div className="flex flex-col px-5 py-6">
      <a
        href="#top"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Home
      </a>
      <a
        href="#about"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        About
      </a>
      <a
        href="#why-ravana"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Why Ravana
      </a>

            <a
        href="#gallery-preview"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Gallery
      </a>

      <a
        href="#plans"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Plans
      </a>
      <a
        href="#schedule"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Schedule
      </a>
      <a
        href="#contact"
        onClick={() => setMobileMenuOpen(false)}
        className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
      >
        Contact
      </a>

      <a
  href="/terms"
  onClick={() => setMobileMenuOpen(false)}
  className="border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-red-500"
>
  Terms
</a>

      <div className="mt-6 flex flex-col gap-3">
  <a
    href="/register"
    onClick={() => setMobileMenuOpen(false)}
    className="btn-primary w-full text-center"
  >
    Register
  </a>
  <a
    href="/login"
    onClick={() => setMobileMenuOpen(false)}
    className="btn-secondary w-full text-center"
  >
    Member Login
  </a>
  <a
    href="/check-in"
    onClick={() => setMobileMenuOpen(false)}
    className="btn-secondary w-full text-center"
  >
    QR Check-In
  </a>
</div>
    </div>
  </div>
</div>

        {/* HERO */}
        <section className="relative min-h-screen overflow-hidden pt-20 sm:pt-24 md:pt-28">
          <div className="absolute inset-0">
            <img
              src="/hero.jpg"
              alt="GYM RAVANA hero"
              className="h-full w-full object-cover scale-105 transition-transform duration-[6s] hover:scale-110"
            />
          </div>

          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-red-700/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 md:px-10">
            <div className="grid w-full items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="motion-fade-up max-w-3xl pt-6 pb-12 sm:pt-8 md:pt-16">
                <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-red-800/50 bg-black/40 px-3 py-2 backdrop-blur-md">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)]" />
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.3em] text-gray-200">
  GYM RAVANA
</span>
                </div>

                <h1 className="max-w-4xl text-[2.9rem] sm:text-6xl md:text-7xl lg:text-[6.2rem] font-black uppercase leading-[0.9] sm:leading-[0.88]">
                  Forge Your
                  <span className="block text-red-500">Strength</span>
                  <span className="block text-white">At GYM RAVANA</span>
                </h1>

                <p className="mt-6 max-w-2xl text-[15px] leading-7 text-gray-300 sm:text-base sm:leading-8 md:text-lg">
                  A high-intensity training space built for discipline, power,
                  and real transformation. Train harder, move better, and build
                  a body that reflects your mindset.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
                  <a
  href="/register"
  className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3.5 text-[11px] sm:px-8 sm:py-4 sm:text-sm font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white shadow-[0_12px_35px_rgba(220,38,38,0.35)] transition-all duration-300 hover:scale-[1.05] hover:bg-red-700 active:scale-[0.97]"
>
  Register Now
</a>

<a
  href="/login"
  className="inline-flex items-center justify-center rounded-xl border border-gray-500 bg-white/5 px-6 py-3.5 text-[11px] sm:px-8 sm:py-4 sm:text-sm font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white transition hover:bg-white/10"
>
  Member Login
</a>
                </div>

                <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
                  <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-red-500">500+</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-gray-400">
                      Active Members
                    </p>
                  </div>

                  <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-red-500">MWF</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-gray-400">
                      Zumba & Cardio
                    </p>
                  </div>

                  <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-red-500">Sat</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-gray-400">
                      Yoga & Meditation
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden justify-end pb-16 lg:flex">
                <div className="motion-fade-up motion-delay-2 motion-hover w-full max-w-sm rounded-[28px] border border-white/10 bg-black/45 p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-red-500">
                    Today at GYM RAVANA
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                        Weekday Hours
                      </p>
                      <p className="mt-3 text-gray-300">5:00 AM – 11:00 AM</p>
                      <p className="text-gray-300">4:00 PM – 10:00 PM</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                        Personal Training
                      </p>
                      <p className="mt-3 text-2xl font-black text-red-500">
                        LKR 5000
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Expert-guided training support
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-900/40 bg-red-600/10 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                        Start Membership
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">
                        LKR 3500
                      </p>
                      <p className="mt-1 text-sm text-gray-300">
                        + LKR 1000 admission
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />
        </section>

        {/* ABOUT */}
        <section id="about" className="section-wide scroll-mt-[100px] bg-[#0a0a0a] px-4 sm:px-6 md:px-10">
          <div className="container-custom motion-fade-up grid items-center gap-14 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-4 text-sm text-red-500">
                About GYM RAVANA
              </p>

              <h2 className="heading-xl text-4xl leading-tight md:text-5xl">
                Built for Those Who Want
                <span className="mt-2 block text-red-600">
                  More Than Average
                </span>
              </h2>

              <p className="mt-8 text-lg leading-8 text-gray-300">
                GYM RAVANA is more than a place to work out. It is a space built
                for discipline, strength, consistency, and transformation.
                Whether you are starting your journey or pushing your limits, we
                give you the environment to grow stronger in body and mind.
              </p>

              <p className="mt-6 leading-8 text-gray-400">
                With powerful equipment, focused training, and a serious
                atmosphere, GYM RAVANA helps members unlock their full potential
                and train like warriors.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <div className="motion-fade-up motion-delay-1 motion-hover min-w-[150px] rounded-xl border border-red-900/40 bg-[#111] px-4 py-3.5 sm:px-5 sm:py-4">
                  <h3 className="text-2xl font-bold text-red-500">500+</h3>
                  <p className="mt-1 text-sm uppercase tracking-wider text-gray-400">
                    Active Members
                  </p>
                </div>

                <div className="motion-fade-up motion-delay-2 motion-hover min-w-[150px] rounded-xl border border-red-900/40 bg-[#111] px-4 py-3.5 sm:px-5 sm:py-4">
                  <h3 className="text-2xl font-bold text-red-500">10+</h3>
                  <p className="mt-1 text-sm uppercase tracking-wider text-gray-400">
                    Expert Trainers
                  </p>
                </div>

                <div className="motion-fade-up motion-delay-3 motion-hover min-w-[150px] rounded-xl border border-red-900/40 bg-[#111] px-4 py-3.5 sm:px-5 sm:py-4">
                  <h3 className="text-2xl font-bold text-red-500">24/7</h3>
                  <p className="mt-1 text-sm uppercase tracking-wider text-gray-400">
                    Warrior Mindset
                  </p>
                </div>
              </div>
            </div>

            <div className="motion-fade-up motion-delay-2 relative">
              <div className="absolute -inset-4 rounded-3xl bg-red-600/10 blur-2xl" />
              <img
                src="/about.jpg"
                alt="About GYM RAVANA"
                className="relative z-10 h-[280px] sm:h-[380px] md:h-[500px] w-full rounded-2xl border border-red-900/30 object-cover shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* PLANS */}
        <section id="plans" className="section-wide scroll-mt-[100px] bg-black px-4 sm:px-6 md:px-10">
          <div className="container-custom motion-fade-up">
            <div className="max-w-3xl">
              <p className="eyebrow mb-4 text-sm text-red-500">
                Membership Plans
              </p>

              <h2 className="heading-xl text-4xl md:text-5xl">
                Choose the <span className="text-red-600">Commitment</span>
                <span className="block">That Matches Your Goal</span>
              </h2>

              <p className="mt-6 text-lg leading-8 text-gray-400">
                Start with a monthly plan, build consistency with a longer
                membership, or train with expert guidance through personal
                coaching.
              </p>

              <div className="divider-red" />
            </div>

            <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
              <div className="motion-fade-up motion-delay-1 motion-hover card flex flex-col justify-between p-5 sm:p-6 md:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="eyebrow text-xs text-gray-400">
                      Starter Plan
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-300">
                      Monthly
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-4xl uppercase text-white">
                    LKR 3500
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    + LKR 1000 admission fee
                  </p>

                  <p className="mt-6 leading-7 text-gray-400">
                    Best for first-time members who want to start training
                    immediately and experience the GYM RAVANA environment.
                  </p>

                  <div className="mt-6 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Flexible starting option
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Full gym access during opening hours
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Great for building momentum
                    </div>
                  </div>
                </div>

                <a
  href="#contact"
  className="btn-secondary mt-7 w-full text-center !px-4 !py-3 text-[10px] sm:text-[11px] tracking-[0.08em] sm:tracking-[0.12em]"
>
  Select Plan
</a>
              </div>

              <div className="motion-fade-up motion-delay-2 relative overflow-hidden rounded-[30px] border border-red-900/40 bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-black p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:p-10">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-600/15 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-red-700/10 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-red-800/40 bg-red-600/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
                      Most Popular
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-300">
                      Best Balance
                    </span>
                  </div>

                  <p className="eyebrow mt-8 text-xs text-red-400">
                    3 Months Membership
                  </p>

                  <div className="mt-4 flex items-end gap-3">
                    <h3 className="font-display text-4xl sm:text-5xl uppercase text-white md:text-6xl">
                      LKR 6500
                    </h3>
                  </div>

                  <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
                    The smartest choice for members who want enough time to
                    build a real routine, see progress, and stay committed
                    without jumping straight into a long-term plan.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Best For
                      </p>
                      <p className="mt-3 font-semibold text-white">
                        Serious beginners and regular members
                      </p>
                    </div>

                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Why It Wins
                      </p>
                      <p className="mt-3 font-semibold text-white">
                        Strong value with real commitment
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Better commitment than monthly
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Enough time to build consistency
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Ideal for visible progress
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <a
                      href="#contact"
                      className="btn-primary w-full text-center sm:w-auto"
                    >
                      Join This Plan
                    </a>

                    <a
                      href="#contact"
                      className="btn-secondary w-full text-center sm:w-auto"
                    >
                      Ask a Question
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="motion-fade-up motion-delay-3 motion-hover card p-5 sm:p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="eyebrow text-xs text-gray-400">
                      Long-Term Value
                    </p>
                    <span className="rounded-full border border-red-900/30 bg-red-600/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-400">
                      6 Months
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-4xl uppercase text-white">
                    LKR 7500
                  </h3>

                  <p className="mt-5 leading-7 text-gray-400">
                    A stronger commitment for members focused on steady
                    transformation, discipline, and long-term results.
                  </p>

                  <a
                    href="#contact"
                    className="btn-secondary mt-7 w-full text-center !px-4 !py-3 text-[10px] md:text-[11px] tracking-[0.1em]"
                  >
                    Choose 6 Months
                  </a>
                </div>

                <div className="motion-fade-up motion-delay-4 motion-hover card p-5 sm:p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="eyebrow text-xs text-gray-400">
                      Best Commitment
                    </p>
                    <span className="rounded-full border border-red-900/30 bg-red-600/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-400">
                      1 Year
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-4xl uppercase text-white">
                    LKR 9500
                  </h3>

                  <p className="mt-5 leading-7 text-gray-400">
                    Built for members who already know they are serious and want
                    the strongest long-term value.
                  </p>

                  <a
                    href="#contact"
                    className="btn-secondary mt-7 w-full text-center !px-4 !py-3 text-[10px] md:text-[11px] tracking-[0.1em]"
                  >
                    Commit for 1 Year
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-[1fr_1fr_1.1fr]">
              <div className="motion-fade-up motion-delay-1 motion-hover relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d] p-7">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-red-600/10 blur-2xl" />
                <div className="relative z-10">
                  <p className="eyebrow text-xs text-red-400">
                    Partner Offer
                  </p>
                  <h3 className="mt-4 font-display text-3xl uppercase text-white">
                    Couple Plan
                  </h3>
                  <p className="mt-3 text-3xl font-bold text-red-500">
                    LKR 15000
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    1 year for two people
                  </p>
                  <p className="mt-5 leading-7 text-gray-400">
                    Train together, stay accountable, and make consistency
                    easier as a team.
                  </p>
                  <a
                    href="#contact"
                    className="btn-secondary mt-6 inline-flex text-center"
                  >
                    Ask About Couple Plan
                  </a>
                </div>
              </div>

              <div className="motion-fade-up motion-delay-2 motion-hover relative overflow-hidden rounded-[24px] border border-red-900/30 bg-red-600/10 p-7">
                <div className="relative z-10">
                  <p className="eyebrow text-xs text-red-300">
                    Coaching Upgrade
                  </p>
                  <h3 className="mt-4 font-display text-3xl uppercase text-white">
                    Personal Training
                  </h3>
                  <p className="mt-3 text-3xl font-bold text-white">
                    LKR 5000
                  </p>
                  <p className="mt-5 leading-7 text-gray-300">
                    Expert-guided sessions for members who want accountability,
                    better form, and faster progress.
                  </p>
                  <a
                    href="#contact"
                    className="btn-primary mt-6 inline-flex text-center"
                  >
                    Book Personal Training
                  </a>
                </div>
              </div>

              <div className="motion-fade-up motion-delay-3 motion-hover rounded-[24px] border border-white/10 bg-[#101010] p-7">
                <p className="eyebrow text-xs text-gray-400">Quick Notes</p>

                <div className="mt-6 space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                    <p>
                      Monthly membership includes an additional LKR 1000
                      admission fee.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                    <p>
                      Longer-term plans are better for building discipline and
                      visible progress.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                    <p>
                      Need help choosing? Contact the gym and we’ll guide you to
                      the right plan.
                    </p>
                  </div>
                </div>

                <a
                  href="#contact"
                  className="btn-secondary mt-7 inline-flex text-center"
                >
                  Talk Before Joining
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY RAVANA */}
        <section id="why-ravana" className="section-wide scroll-mt-[100px] bg-[#070707] px-4 sm:px-6 md:px-10">
          <div className="container-custom">
            <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="motion-fade-up lg:sticky lg:top-32">
                <p className="eyebrow mb-4 text-sm text-red-500">
                  Why GYM RAVANA
                </p>

                <h2 className="heading-xl text-4xl leading-[0.95] md:text-5xl">
                  Not Built for
                  <span className="block text-red-600">Average</span>
                </h2>

                <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300">
                  GYM RAVANA is for people who want more than a casual workout.
                  It is a space for discipline, intensity, consistency, and
                  real self-improvement.
                </p>

                <p className="mt-6 max-w-xl leading-8 text-gray-400">
                  Every session is a chance to push further, move with purpose,
                  and build both physical strength and mental toughness in an
                  environment that respects serious effort.
                </p>

                <div className="divider-red mt-8" />
              </div>

              <div className="grid gap-6">
                <div className="motion-fade-up motion-delay-1 relative overflow-hidden rounded-[26px] border border-red-900/30 bg-[#111] p-5 sm:p-6 md:p-10">
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-red-600/10 blur-2xl" />

                  <div className="relative z-10">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      01 / Environment
                    </p>
                    <h3 className="font-display text-[1.9rem] leading-[1] sm:text-3xl uppercase text-white md:text-4xl">
                      Serious Training Energy
                    </h3>
                    <p className="mt-5 max-w-2xl leading-8 text-gray-400">
                      A focused atmosphere built for people who want to train
                      with intent. No wasted sessions. No weak energy. Just a
                      space that pushes you to show up stronger every day.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="motion-fade-up motion-delay-2 motion-hover card p-5 sm:p-6 md:p-8">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      02 / Equipment
                    </p>
                    <h3 className="font-display text-2xl uppercase text-white md:text-3xl">
                      Strength First
                    </h3>
                    <p className="mt-4 leading-7 text-gray-400">
                      Train with machines, free weights, and space that support
                      real progression and hard work.
                    </p>
                  </div>

                  <div className="motion-fade-up motion-delay-3 motion-hover card p-5 sm:p-6 md:p-8">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      03 / Guidance
                    </p>
                    <h3 className="font-display text-2xl uppercase text-white md:text-3xl">
                      Expert Support
                    </h3>
                    <p className="mt-4 leading-7 text-gray-400">
                      From class sessions to personal training, guidance is
                      available to help members train smarter and stay
                      consistent.
                    </p>
                  </div>
                </div>

                <div className="motion-fade-up motion-delay-4 relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-r from-[#101010] to-[#0a0a0a] p-8 md:p-10">
                  <div className="absolute left-0 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-red-700/10 blur-2xl" />

                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="eyebrow mb-3 text-xs text-red-400">
                        04 / Mindset
                      </p>
                      <h3 className="font-display text-[2rem] leading-[1] sm:text-3xl uppercase text-white md:text-4xl">
                        Discipline Becomes Identity
                      </h3>
                      <p className="mt-5 max-w-2xl leading-8 text-gray-400">
                        GYM RAVANA is not just about looking fit. It is about
                        building the habit, discipline, and mindset that
                        transforms how you live.
                      </p>
                    </div>

                    <div className="shrink-0">
                      <a
  href="#contact"
  className="btn-primary w-full md:w-auto text-center !px-4 !py-3 text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.08em] sm:tracking-[0.12em]"
>
  Train With Us
</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="motion-fade-up motion-delay-2 mt-10 rounded-[24px] border border-red-900/30 bg-red-600/10 px-6 py-6 md:px-8">
              <p className="text-center font-display text-[1.35rem] leading-tight sm:text-2xl uppercase tracking-[0.04em] sm:tracking-[0.08em] text-white md:text-3xl">
                Strength. Discipline. Power.{" "}
                <span className="text-red-400">
                  Every Rep. Every Set. Every Day.
                </span>
              </p>
            </div>
          </div>
        </section>

        <HomeGalleryPreview />

        {/* SCHEDULE */}
        <section id="schedule" className="section-wide scroll-mt-[100px] bg-black px-4 sm:px-6 md:px-10">
          <div className="container-custom motion-fade-up">
            <div className="max-w-3xl">
              <p className="eyebrow mb-4 text-sm text-red-500">
                Training Schedule
              </p>
              <h2 className="heading-xl text-4xl md:text-5xl">
                Train on a <span className="text-red-600">Real Routine</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Built around serious training hours and structured weekly
                classes, GYM RAVANA gives members a routine they can actually
                commit to.
              </p>
              <div className="divider-red" />
            </div>

            <div className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="motion-fade-up motion-delay-1 relative overflow-hidden rounded-[28px] border border-red-900/30 bg-[#0f0f0f] p-5 sm:p-6 md:p-10">
                <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-red-700/10 blur-2xl" />
                <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-red-600/10 blur-3xl" />

                <div className="relative z-10">
                  <p className="eyebrow mb-4 text-xs text-red-400">
                    Gym Hours
                  </p>
                  <h3 className="font-display text-[1.9rem] leading-[1] sm:text-3xl uppercase text-white md:text-4xl">
                    Open for Early
                    <span className="block text-red-600">
                      and Late Sessions
                    </span>
                  </h3>

                  <div className="mt-10 space-y-5">
                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold uppercase tracking-[0.16em] text-white">
                          Weekdays
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-300">
                          Mon – Fri
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-gray-300">
                        <p>5:00 AM – 11:00 AM</p>
                        <p>4:00 PM – 10:00 PM</p>
                      </div>
                    </div>

                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold uppercase tracking-[0.16em] text-white">
                          Saturday
                        </p>
                        <span className="rounded-full border border-red-900/30 bg-red-600/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-400">
                          Weekend
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-gray-300">
                        <p>8:00 AM – 11:00 AM</p>
                        <p>4:00 PM – 8:00 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-red-900/30 bg-red-600/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-red-400">
                      Best For
                    </p>
                    <p className="mt-3 leading-7 text-gray-200">
                      Early training, after-work sessions, and members who need
                      flexible daily access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="motion-fade-up motion-delay-2 relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6 md:p-10">
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-red-600/10 blur-2xl" />

                  <div className="relative z-10">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="eyebrow mb-3 text-xs text-red-400">
                          Class 01
                        </p>
                        <h3 className="font-display text-[1.9rem] leading-[1] sm:text-3xl uppercase text-white md:text-4xl">
                          Zumba / Cardiovascular
                        </h3>
                      </div>

                      <span className="shrink-0 rounded-full border border-red-900/30 bg-red-600/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-300">
                        Mon • Wed • Fri
                      </span>
                    </div>

                    <p className="mt-6 max-w-2xl leading-8 text-gray-400">
                      High-energy group sessions built to improve endurance,
                      movement, rhythm, and fat-burning performance.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                          Morning Session
                        </p>
                        <p className="mt-3 text-xl font-semibold text-white">
                          8:00 AM – 9:00 AM
                        </p>
                      </div>

                      <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                          Evening Session
                        </p>
                        <p className="mt-3 text-xl font-semibold text-white">
                          7:00 PM – 8:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="motion-fade-up motion-delay-3 relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-[#101010] to-[#0b0b0b] p-5 sm:p-6 md:p-10">
                  <div className="absolute left-0 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-red-700/10 blur-2xl" />

                  <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="eyebrow mb-3 text-xs text-red-400">
                        Class 02
                      </p>
                      <h3 className="font-display text-[1.9rem] leading-[1] sm:text-3xl uppercase text-white md:text-4xl">
                        Yoga & Meditation
                      </h3>

                      <p className="mt-6 max-w-2xl leading-8 text-gray-400">
                        A focused session for recovery, flexibility, breath
                        control, and mental reset after a hard training week.
                      </p>
                    </div>

                    <div className="min-w-[220px] shrink-0 rounded-2xl border border-red-900/30 bg-red-600/10 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-red-400">
                        Saturday Session
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        6:30 PM – 8:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="motion-fade-up motion-delay-1 motion-hover rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                  Flexible Access
                </p>
                <p className="mt-2 font-semibold text-white">
                  Early morning and after-work training slots
                </p>
              </div>

              <div className="motion-fade-up motion-delay-2 motion-hover rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                  Weekly Classes
                </p>
                <p className="mt-2 font-semibold text-white">
                  Cardio, Zumba, Yoga, and Meditation sessions
                </p>
              </div>

              <div className="motion-fade-up motion-delay-3 motion-hover rounded-2xl border border-red-900/30 bg-red-600/10 px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-400">
                  Built for Routine
                </p>
                <p className="mt-2 font-semibold text-white">
                  Consistency starts with a schedule you can follow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="section-wide scroll-mt-[100px] bg-[#050505] px-4 sm:px-6 md:px-10">
          <div className="container-custom">
            <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="motion-fade-up relative overflow-hidden rounded-[30px] border border-red-900/30 bg-gradient-to-br from-[#111] via-[#0b0b0b] to-black p-5 sm:p-6 md:p-10 lg:p-12">
                <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-red-700/15 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />

                <div className="relative z-10">
                  <p className="eyebrow mb-4 text-sm text-red-500">
                    Start Your Journey
                  </p>

                  <h2 className="heading-xl text-4xl leading-[0.95] md:text-5xl">
                    Ready to Train
                    <span className="block text-red-600">With Purpose?</span>
                  </h2>

                  <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300">
                    Whether you want to get stronger, stay consistent, join
                    classes, or start personal training, GYM RAVANA gives you
                    the environment to move forward with discipline and intent.
                  </p>

                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Main Plan Starts
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        LKR 3500
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        + LKR 1000 admission
                      </p>
                    </div>

                    <div className="motion-hover rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        Personal Training
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        LKR 5000
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Expert-guided sessions
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
  <a
    href="/register"
    className="btn-primary w-full text-center sm:w-auto"
  >
    Register Account
  </a>

  <a
    href="/login"
    className="btn-secondary w-full text-center sm:w-auto"
  >
    Member Login
  </a>

  <a
    href="/check-in"
    className="btn-secondary w-full text-center sm:w-auto"
  >
    QR Check-In
  </a>
</div>

                  <p className="mt-8 text-sm text-gray-500">
                    Fastest response usually happens through WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="motion-fade-up motion-delay-1 motion-hover card p-5 sm:p-6 md:p-7">
                    <p className="eyebrow mb-3 text-xs text-red-400">Phone</p>
                    <h3 className="font-display text-2xl uppercase text-white">
                      Call Us
                    </h3>
                    <p className="mt-4 text-lg text-gray-300">
                      +94 76 551 9293
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      For quick inquiries and membership details
                    </p>
                  </div>

                  <div className="motion-fade-up motion-delay-2 motion-hover card p-5 sm:p-6 md:p-7">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      Location
                    </p>
                    <h3 className="font-display text-2xl uppercase text-white">
                      Visit GYM RAVANA
                    </h3>
                    <p className="mt-4 text-lg text-gray-300">
                      Ragama, Sri Lanka
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Easy to reach for daily and weekend training
                    </p>
                  </div>

                  <div className="motion-fade-up motion-delay-3 motion-hover card p-5 sm:p-6 md:p-7">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      Weekdays
                    </p>
                    <h3 className="font-display text-2xl uppercase text-white">
                      Training Hours
                    </h3>
                    <p className="mt-4 text-gray-300">5:00 AM – 11:00 AM</p>
                    <p className="text-gray-300">4:00 PM – 10:00 PM</p>
                  </div>

                  <div className="motion-fade-up motion-delay-4 motion-hover card p-5 sm:p-6 md:p-7">
                    <p className="eyebrow mb-3 text-xs text-red-400">
                      Saturday
                    </p>
                    <h3 className="font-display text-2xl uppercase text-white">
                      Weekend Hours
                    </h3>
                    <p className="mt-4 text-gray-300">8:00 AM – 11:00 AM</p>
                    <p className="text-gray-300">4:00 PM – 8:00 PM</p>
                  </div>
                </div>

                <div className="motion-fade-up motion-delay-2 rounded-[28px] border border-white/10 bg-[#101010] p-5 sm:p-6 md:p-8">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="eyebrow mb-3 text-xs text-red-400">
                        Quick Inquiry
                      </p>
                      <h3 className="font-display text-3xl uppercase text-white">
                        Send a Message
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500">
                      Ask about memberships, classes, or personal training
                    </p>
                  </div>

                  <form className="mt-8 grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 sm:px-5 sm:py-4 text-white outline-none transition focus:border-red-600"
                      />

                      <input
                        type="text"
                        placeholder="Phone Number"
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 sm:px-5 sm:py-4 text-white outline-none transition focus:border-red-600"
                      />
                    </div>

                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 sm:px-5 sm:py-4 text-white outline-none transition focus:border-red-600"
                    />

                    <textarea
                      placeholder="Tell us what you’re looking for"
                      rows={5}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 sm:px-5 sm:py-4 text-white outline-none transition focus:border-red-600"
                    ></textarea>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        We usually reply faster on WhatsApp for urgent
                        inquiries.
                      </p>

                      <button
  type="submit"
  className="btn-primary w-full sm:w-auto text-[10px] sm:text-[11px] tracking-[0.08em] sm:tracking-[0.12em]"
>
  Send Message
</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-black">
          <div className="container-custom section-tight">
            <div className="grid gap-8 sm:gap-10 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-900/40 bg-red-600/10">
                    <span className="font-display text-xl font-bold text-red-500">
                      R
                    </span>
                  </div>

                  <div>
                    <p className="font-display text-lg sm:text-xl font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-red-600">
                      GYM RAVANA
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                      Warrior Performance Gym
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-gray-400">
                  A high-intensity training space built for discipline,
                  strength, and transformation. Train like a warrior.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Navigation
                </p>

                <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
                  <a href="#top" className="transition hover:text-red-500">
                    Home
                  </a>
                  <a href="#about" className="transition hover:text-red-500">
                    About
                  </a>
                  <a
                    href="#why-ravana"
                    className="transition hover:text-red-500"
                  >
                    Why Ravana
                  </a>
                  <a href="#plans" className="transition hover:text-red-500">
                    Plans
                  </a>
                  <a href="#schedule" className="transition hover:text-red-500">
                    Schedule
                  </a>
                  <a href="#contact" className="transition hover:text-red-500">
                    Contact
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Contact
                </p>

                <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
                  <p>Ragama, Sri Lanka</p>
                  <p>+94 76 551 9293</p>
                  <p>gymravana@email.com</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Start Now
                </p>

                <p className="mt-4 text-sm text-gray-400">
                  Join GYM RAVANA and start building your strongest self today.
                </p>

                <div className="mt-5 flex flex-col gap-3">
  <a
    href="/register"
    className="btn-primary inline-flex w-full items-center justify-center text-[10px] sm:text-[11px] tracking-[0.08em] sm:tracking-[0.12em]"
  >
    Register
  </a>
  <a
    href="/login"
    className="btn-secondary inline-flex w-full items-center justify-center text-[10px] sm:text-[11px] tracking-[0.08em] sm:tracking-[0.12em]"
  >
    Member Login
  </a>
</div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <div className="flex flex-col items-center justify-between gap-4 text-xs text-gray-500 md:flex-row">
                <p>© 2026 GYM RAVANA. All rights reserved.</p>

                <div className="flex items-center gap-4">
                  <span className="cursor-pointer transition hover:text-red-500">
                    Privacy
                  </span>
                  <span className="cursor-pointer transition hover:text-red-500">
                    Terms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
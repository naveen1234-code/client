"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGalleryImageUrl } from "@/lib/gallery";

type GalleryImage = {
  fileName: string;
  imageUrl: string;
};

type GallerySection = {
  id: string;
  title: string;
  description: string;
  images: GalleryImage[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function GalleryPage() {
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("");

  useEffect(() => {
    const loadSections = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/gallery`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch gallery sections");
        }

        const data = await res.json();
        setSections(data);
      } catch (err: any) {
        setError(err.message || "Failed to load gallery.");
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImage(null);
        setActiveTitle("");
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Gym Ravana
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Gallery
            </h1>
            <p className="mt-3 text-sm text-neutral-400 sm:text-base">
              Explore our training environment, energy, and gym moments.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-neutral-400">
              Loading gallery...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-20 mb-8 flex flex-wrap justify-center gap-3 rounded-2xl border border-white/10 bg-black/80 p-3 backdrop-blur">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500 hover:text-red-400"
                  >
                    {section.title}
                  </a>
                ))}
              </div>

              <div className="space-y-12">
                {sections.map((section) => {
                  const previewImages = section.images.slice(0, 6);

                  return (
                    <section
                      key={section.id}
                      id={section.id}
                      className="rounded-3xl border border-white/10 bg-neutral-950 p-5 shadow-2xl sm:p-6"
                    >
                      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                            Gallery Section
                          </p>
                          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                            {section.title}
                          </h2>
                          <p className="mt-2 text-sm text-neutral-400">
                            {section.description}
                          </p>
                        </div>

                        <Link
                          href={`/gallery/${section.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500 hover:text-red-400"
                        >
                          View More
                        </Link>
                      </div>

                      {previewImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {previewImages.map((image) => (
                            <button
                              key={image.fileName}
                              type="button"
                              onClick={() => {
                                setActiveImage(getGalleryImageUrl(image.imageUrl));
                                setActiveTitle(section.title);
                              }}
                              className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 text-left"
                            >
                              <img
                                src={getGalleryImageUrl(image.imageUrl)}
                                alt={section.title}
                                className="h-44 w-full object-cover transition duration-300 hover:scale-105 sm:h-56"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-500">
                          No images added to this section yet.
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {activeImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => {
            setActiveImage(null);
            setActiveTitle("");
          }}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setActiveImage(null);
                setActiveTitle("");
              }}
              className="absolute right-0 top-[-52px] rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
            >
              Close
            </button>

            <img
              src={activeImage}
              alt={activeTitle}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />

            <div className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              {activeTitle}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
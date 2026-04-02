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

export default function GallerySectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const [section, setSection] = useState<GallerySection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const loadSection = async () => {
      try {
        const { sectionId } = await params;

        const res = await fetch(`${API_BASE}/api/gallery/${sectionId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch gallery section");
        }

        const data = await res.json();
        setSection(data);
      } catch (err: any) {
        setError(err.message || "Failed to load gallery section.");
      } finally {
        setLoading(false);
      }
    };

    loadSection();
  }, [params]);

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImage(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-neutral-400">
              Loading section...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-300">
              {error}
            </div>
          ) : section ? (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                    Full Gallery
                  </p>
                  <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">
                    {section.title}
                  </h1>
                  <p className="mt-3 text-sm text-neutral-400 sm:text-base">
                    {section.description}
                  </p>
                </div>

                <Link
                  href="/gallery"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500 hover:text-red-400"
                >
                  Back to Gallery
                </Link>
              </div>

              {section.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {section.images.map((image) => (
                    <button
                      key={image.fileName}
                      type="button"
                      onClick={() => setActiveImage(getGalleryImageUrl(image.imageUrl))}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 text-left"
                    >
                      <img
                        src={getGalleryImageUrl(image.imageUrl)}
                        alt={section.title}
                        className="h-44 w-full object-cover transition duration-300 hover:scale-105 sm:h-56 lg:h-64"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-neutral-500">
                  No images available in this section yet.
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>

      {activeImage && section && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute right-0 top-[-52px] rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
            >
              Close
            </button>

            <img
              src={activeImage}
              alt={section.title}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />

            <div className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              {section.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function HomeGalleryPreview() {
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/gallery`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load gallery");
        }

        const data = await res.json();
        setSections(data);
      } catch (err: any) {
        console.error("Gallery preview load failed:", err);
        setError("Failed to load gallery preview.");
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
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
      <section
        id="gallery-preview"
        className="section-wide scroll-mt-[100px] bg-[#070707] px-4 sm:px-6 md:px-10"
      >
        <div className="container-custom">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4 text-sm text-red-500">Gallery Preview</p>
            <h2 className="heading-xl text-4xl md:text-5xl">
              A Look Inside <span className="text-red-600">Gym Ravana</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Explore the training environment, the energy, and the atmosphere that defines Gym Ravana.
            </p>
            <div className="divider-red" />
          </div>

          {loading && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
              Loading gallery preview...
            </div>
          )}

          {error && (
            <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {sections.map((section) => {
                const previewImages = section.images.slice(0, 4);

                return (
                  <div
                    key={section.id}
                    className="rounded-[28px] border border-white/10 bg-[#111] p-5 shadow-2xl"
                  >
                    <div className="mb-5">
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-400">
                        Gallery Card
                      </p>
                      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-[#dcecff]">
                        {section.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400">{section.description}</p>
                    </div>

                    {previewImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {previewImages.map((image) => (
                          <button
                            key={image.fileName}
                            type="button"
                            onClick={() => {
                              setActiveImage(`${API_BASE}${image.imageUrl}`);
                              setActiveTitle(section.title);
                            }}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-black text-left"
                          >
                            <img
                              src={`${API_BASE}${image.imageUrl}`}
                              alt={section.title}
                              className="h-32 w-full object-cover transition duration-300 hover:scale-105 sm:h-36"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
                        No images added yet.
                      </div>
                    )}

                    <Link
                      href={`/gallery#${section.id}`}
                      className="btn-secondary mt-5 inline-flex w-full items-center justify-center text-center"
                    >
                      See More
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/gallery"
              className="btn-primary inline-flex items-center justify-center"
            >
              Open Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {activeImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => {
            setActiveImage(null);
            setActiveTitle("");
          }}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl"
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
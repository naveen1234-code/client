"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AdminGalleryPage() {
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [selectedSection, setSelectedSection] = useState("section-1");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSectionTitle = useMemo(() => {
    return sections.find((section) => section.id === selectedSection)?.title || "Selected Section";
  }, [sections, selectedSection]);

  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/gallery`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load gallery sections");
      }

      const data = await res.json();
      setSections(data);

      if (data.length > 0 && !data.find((item: GallerySection) => item.id === selectedSection)) {
        setSelectedSection(data[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load gallery sections:", err);
      setError(err.message || "Failed to load gallery sections.");
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please select at least one image.");
      setMessage("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("sectionId", selectedSection);

      Array.from(selectedFiles).forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`${API_BASE}/api/gallery-admin/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setMessage("Images uploaded successfully.");
      setSelectedFiles(null);

      const fileInput = document.getElementById("gallery-upload-input") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }

      await fetchSections();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sectionId: string, fileName: string) => {
    const confirmed = window.confirm(`Delete this image?\n\n${fileName}`);
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch(`${API_BASE}/api/gallery-admin/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sectionId, fileName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setMessage("Image deleted successfully.");
      await fetchSections();
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(err.message || "Delete failed.");
      setMessage("");
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Admin Panel
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-[#dcecff] sm:text-5xl">
            Gallery Manager
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Upload, manage, and remove gallery photos for the homepage preview, main gallery page,
            and full section pages.
          </p>
        </div>

        <button
  onClick={() => (window.location.href = "/admin")}
  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-orange-500/40 hover:bg-orange-500/10"
>
  Back to Admin
</button>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-orange-400">
            Upload New Images
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>

            <input
              id="gallery-upload-input"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"
            />

            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Images"}
            </button>
          </div>

          <div className="mt-4 text-sm text-white/60">
            Current target: <span className="font-semibold text-orange-300">{selectedSectionTitle}</span>
          </div>

          {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-12 space-y-10">
          {loadingSections ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              Loading gallery sections...
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/50">
              No gallery sections found.
            </div>
          ) : (
            sections.map((section) => (
              <section
                key={section.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6"
              >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
                      Gallery Section
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#dcecff] sm:text-3xl">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">{section.description}</p>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    {section.images.length} Image{section.images.length === 1 ? "" : "s"}
                  </div>
                </div>

                {section.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {section.images.map((image) => (
                      <div
                        key={image.fileName}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black"
                      >
                        <img
                          src={`${API_BASE}${image.imageUrl}`}
                          alt={image.fileName}
                          className="h-44 w-full object-cover"
                        />

                        <div className="border-t border-white/10 p-3">
                          <p className="mb-3 line-clamp-2 text-xs text-white/55">{image.fileName}</p>

                          <button
                            onClick={() => handleDelete(section.id, image.fileName)}
                            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">
                    No images in this section yet.
                  </div>
                )}
              </section>
            ))
          )}
        </div>

        <section className="mt-12 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5 sm:p-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-orange-300">
            Future Updates Ready
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Section title editing
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Drag-and-drop image sorting
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Multi-section upload panel
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Lightbox / fullscreen image viewer
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Protected admin authentication lock
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              Photo captions and section cover images
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
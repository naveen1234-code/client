export type GalleryImage = {
  fileName: string;
  imageUrl: string;
};

export type GallerySection = {
  id: string;
  title: string;
  description: string;
  images: GalleryImage[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getGallerySections(): Promise<GallerySection[]> {
  const res = await fetch(`${API_BASE}/api/gallery`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch gallery sections");
  }

  return res.json();
}

export async function getGallerySection(sectionId: string): Promise<GallerySection> {
  const res = await fetch(`${API_BASE}/api/gallery/${sectionId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch gallery section");
  }

  return res.json();
}

export function getGalleryImageUrl(imageUrl: string) {
  return `${API_BASE}${imageUrl}`;
}
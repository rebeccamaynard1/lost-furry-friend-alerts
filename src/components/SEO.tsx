import { useEffect } from "react";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string;
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export default function SEO({ title, description, canonical }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    document.title = fullTitle;
    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + "..." : description;
      setMeta("description", desc);
      setMeta("og:description", desc, "property");
      setMeta("twitter:description", desc);
    }
    setMeta("og:title", fullTitle, "property");
    setMeta("twitter:title", fullTitle);
    const url = canonical || (typeof window !== "undefined" ? window.location.href : "");
    if (url) setCanonical(url);
  }, [title, description, canonical]);

  return null;
}

"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";

export function ShareTeamsButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — WhatsApp still available
    }
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="share-teams-actions">
      <button type="button" className="btn btn-small btn-secondary" onClick={copy}>
        <Copy size={14} aria-hidden />
        {copied ? "Copiado" : "Copiar"}
      </button>
      <button
        type="button"
        className="btn btn-small btn-primary"
        onClick={openWhatsApp}
      >
        <MessageCircle size={14} aria-hidden />
        WhatsApp
      </button>
    </div>
  );
}

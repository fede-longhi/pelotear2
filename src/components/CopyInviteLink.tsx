"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select the readonly input if clipboard fails.
      const el = document.getElementById(
        "invite-url-input",
      ) as HTMLInputElement | null;
      el?.select();
    }
  }

  return (
    <div className="invite-share">
      <input
        id="invite-url-input"
        className="invite-url"
        value={url}
        readOnly
        aria-label="Link de invitación"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button type="button" variant="secondary" size="sm" onClick={copy}>
        {copied ? "Copiado" : "Copiar link"}
      </Button>
    </div>
  );
}

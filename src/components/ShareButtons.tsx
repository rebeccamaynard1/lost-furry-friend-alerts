import { Facebook, Twitter, MessageSquare, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  /** Optional URL; defaults to current page. */
  url?: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(title);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const smsUrl = `sms:?&body=${encodedText}%20${encodedUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return true;
      } catch {
        /* user cancelled */
      }
    }
    return false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={async () => {
            const used = await nativeShare();
            if (!used) window.open(fbUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <Facebook className="h-4 w-4 mr-2 text-[#1877F2]" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(twUrl, "_blank", "noopener,noreferrer")}
        >
          <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2]" /> Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = smsUrl)}>
          <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Text message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copy}>
          <Link2 className="h-4 w-4 mr-2" /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

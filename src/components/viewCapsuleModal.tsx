import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { openCapsule } from "@/lib/contract-api";
import { toast } from "sonner";

type ViewCapsuleModalProps = {
  title: string;
  date: string;
  dataURI: string;
  children: React.ReactNode;
};

export default function ViewCapsuleModal({
  title,
  date,
  dataURI,
  children,
}: ViewCapsuleModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen || message) return; // already decrypted, don't re-fetch

    setLoading(true);
    setError(null);
    try {
      const plaintext = await openCapsule(dataURI);
      setMessage(plaintext);
      toast.success("Capsule decrypted successfully!");
    } catch (err) {
      console.error("Decryption failed:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Show specific toast based on error type
      if (errorMsg.includes("too early") || errorMsg.includes("round not yet available")) {
        toast.warning("Capsule not ready yet - Drand clock hasn't reached the unlock time. Please wait a bit longer.");
      } else if (errorMsg.includes("time-locked until")) {
        const dateMatch = errorMsg.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (dateMatch) {
          const unlockDate = new Date(dateMatch[1]).toLocaleString();
          toast.info(`Capsule will unlock on ${unlockDate}`);
        } else {
          toast.info("Capsule is time-locked. Check the modal for details.");
        }
      } else if (errorMsg.includes("Unsupported capsule version")) {
        toast.error("This capsule format is not supported by this version of the app. Please update.");
      } else if (errorMsg.includes("malformed")) {
        toast.error("Capsule data is corrupted and cannot be decrypted.");
      } else if (errorMsg.includes("original wallet")) {
        toast.error("Wrong wallet - use the same wallet that created this capsule.");
      } else if (errorMsg.includes("Network error")) {
        toast.error("Network error - please check your connection and try again.");
      } else {
        toast.error(errorMsg || "Failed to decrypt capsule. Make sure you're using the original wallet.");
      }

      setError(
        "Failed to decrypt capsule. Make sure you're using the original wallet.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <p className="text-xs text-gray-400">Unlocked {date}</p>
        </DialogHeader>

        <div className="mt-4 min-h-24 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Spinner className="w-6 h-6" />
              <span className="text-sm">Decrypting...</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && !loading && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap w-full">
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { notifyDecryptionError } from "@/lib/notifications";

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
    if (!isOpen) {
      return; // Dialog is closing
    }

    // If already decrypted, don't re-fetch
    if (message) {
      return;
    }

    // Show loading immediately when dialog opens
    setLoading(true);
    setError(null);

    try {
      const plaintext = await openCapsule(dataURI);
      setMessage(plaintext);
    } catch (err) {
      notifyDecryptionError(err instanceof Error ? err : String(err));
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

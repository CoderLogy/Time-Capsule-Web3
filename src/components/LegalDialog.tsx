import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  type: "terms" | "privacy";
  label: string;
};

export function LegalDialog({ type, label }: Props) {
  const [content, setContent] = useState("");
  const [currentType, setCurrentType] = useState<"terms" | "privacy">(type);
  const [history, setHistory] = useState<Array<"terms" | "privacy">>([type]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const file = currentType === "terms" ? "/TERMS.md" : "/PRIVACY.md";
    fetch(file)
      .then((res) => res.text())
      .then(setContent);
  }, [currentType]);

  const handleLoadMarkdown = (filename: string) => {
    let newType: "terms" | "privacy" = currentType;
    if (filename.toLowerCase().includes("terms")) {
      newType = "terms";
    } else if (filename.toLowerCase().includes("privacy")) {
      newType = "privacy";
    }

    if (newType !== currentType) {
      setHistory([...history, newType]);
      setCurrentType(newType);
    }
  };

  const handleGoBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const previousType = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentType(previousType);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentType(type);
      setHistory([type]);
    }
  };

  const CustomLink = (props: any) => {
    const href = props.href || "";

    if (href.endsWith(".md")) {
      return (
        <a
          {...props}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            handleLoadMarkdown(href);
          }}
          className="text-accent font-medium hover:underline cursor-pointer"
        />
      );
    }

    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent font-medium hover:underline"
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="hover:text-accent transition-colors cursor-pointer duration-200">
          {label}
        </button>
      </DialogTrigger>

      <DialogContent className="w-screen h-screen max-w-none rounded-none p-0 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <button
            onClick={handleGoBack}
            disabled={history.length <= 1}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              history.length <= 1
                ? "text-foreground/40 cursor-not-allowed"
                : "text-foreground/70 hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm text-foreground/60">
            {currentType === "terms" ? "Terms & Conditions" : "Privacy Policy"}
          </span>
          <div className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <article className="prose dark:prose-invert max-w-4xl mx-auto px-6 py-8 leading-relaxed prose-h1:text-3xl prose-h1:font-bold prose-h1:text-foreground prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-foreground prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-xl prose-h3:font-semibold prose-h3:text-foreground prose-h3:mt-4 prose-h3:mb-2 prose-p:text-base prose-p:leading-7 prose-p:text-foreground/90 prose-strong:font-semibold prose-strong:text-foreground prose-a:text-accent prose-a:font-medium hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:bg-muted/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded prose-blockquote:text-foreground/80 prose-li:text-foreground/90 prose-li:marker:text-foreground/60 prose-th:bg-muted/30 prose-th:text-foreground prose-th:font-semibold prose-td:border-border prose-td:text-foreground/90 prose-code:bg-muted/40 prose-code:text-foreground prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border prose-pre:text-foreground prose-pre:rounded-lg prose-hr:border-foreground/20 prose-hr:my-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: CustomLink,
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
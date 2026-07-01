import { useEffect, useId, useState, type ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";

type ToolHelpDialogProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ToolHelpDialog({
  title,
  eyebrow = "guide",
  children,
}: ToolHelpDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        className="iconButton toolHelpButton"
        type="button"
        aria-label={`${title} help`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="查看操作说明"
        onClick={() => setOpen(true)}
      >
        <HelpCircle size={17} />
      </button>

      {open ? (
        <div
          className="dialogLayer"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <section
            className="toolHelpDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="dialogEyebrow">{eyebrow}</span>
                <h2 id={titleId}>{title}</h2>
              </div>
              <button
                className="iconButton"
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="toolHelpContent">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}

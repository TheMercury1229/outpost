"use client";

import {
  Check,
  Copy,
  FileText,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setWorkspaceSharing } from "@/actions/workspaces-actions";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UPGRADE_REASONS } from "@/data/plan-limits";
import { useWorkspaceEditors } from "../providers/workspace-editor-context";

interface ShareDialogProps {
  workspaceId: string;
  workspaceName: string;
  initialShareToken: string | null;
  canShare: boolean;
  canExportPdf: boolean;
}

export function ShareDialog({
  workspaceId,
  workspaceName,
  initialShareToken,
  canShare,
  canExportPdf,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(
    initialShareToken,
  );
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isExportingCanvas, setIsExportingCanvas] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const { docEditor, canvasEditor } = useWorkspaceEditors();
  const openUpgrade = useUpgradeDialog();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setShareToken(initialShareToken);
  }, [initialShareToken]);

  const isShared = Boolean(shareToken);
  const shareUrl = shareToken ? `${origin || ""}/shared/${shareToken}` : "";

  const handleToggleSharing = async (checked: boolean) => {
    if (!canShare) {
      setOpen(false);
      openUpgrade(UPGRADE_REASONS.sharing);
      return;
    }

    setIsUpdatingToken(true);
    try {
      const res = await setWorkspaceSharing(workspaceId, checked);
      if ("limit" in res && res.limit === "sharing") {
        setOpen(false);
        openUpgrade(UPGRADE_REASONS.sharing);
        return;
      }
      if ("token" in res) {
        setShareToken(res.token);
        if (res.token) {
          toast.success("Public link enabled");
        } else {
          toast.success("Public link disabled");
        }
      }
    } catch {
      toast.error("Failed to update sharing settings");
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const handleResetToken = async () => {
    if (!canShare) {
      setOpen(false);
      openUpgrade(UPGRADE_REASONS.sharing);
      return;
    }

    setIsUpdatingToken(true);
    try {
      const res = await setWorkspaceSharing(workspaceId, true);
      if ("limit" in res && res.limit === "sharing") {
        setOpen(false);
        openUpgrade(UPGRADE_REASONS.sharing);
        return;
      }
      if ("token" in res && res.token) {
        setShareToken(res.token);
        toast.success("New share link generated");
      }
    } catch {
      toast.error("Failed to generate new share link");
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleExportDoc = async () => {
    if (!canExportPdf) {
      setOpen(false);
      openUpgrade(UPGRADE_REASONS.pdfExport);
      return;
    }
    if (!docEditor) {
      toast.error("Document panel is not open");
      return;
    }

    setIsExportingDoc(true);
    try {
      const [{ PDFExporter, pdfDefaultSchemaMappings }, { pdf }] =
        await Promise.all([
          import("@blocknote/xl-pdf-exporter/react-pdf"),
          import("@react-pdf/renderer"),
        ]);

      const exporter = new PDFExporter(
        docEditor.schema,
        pdfDefaultSchemaMappings,
      );
      const pdfDocument = await exporter.toReactPDFDocument(docEditor.document);
      const blob = await pdf(pdfDocument).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const safeName = (workspaceName || "document").replace(/[^\w-]/g, "_");
      a.download = `${safeName}-doc.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success("Document exported as PDF");
    } catch (err) {
      console.error("Doc PDF export error:", err);
      toast.error("Failed to export document as PDF");
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleExportCanvas = async () => {
    if (!canExportPdf) {
      setOpen(false);
      openUpgrade(UPGRADE_REASONS.pdfExport);
      return;
    }
    if (!canvasEditor) {
      toast.error("Canvas panel is not open");
      return;
    }

    setIsExportingCanvas(true);
    try {
      const shapeIds = Array.from(canvasEditor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) {
        toast.error("Canvas is empty");
        setIsExportingCanvas(false);
        return;
      }

      const [{ jsPDF }] = await Promise.all([import("jspdf")]);

      const { url, width, height } = await canvasEditor.toImageDataUrl(
        shapeIds,
        {
          format: "png",
          scale: 2,
        },
      );

      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(url, "PNG", 0, 0, width, height);
      const safeName = (workspaceName || "canvas").replace(/[^\w-]/g, "_");
      pdf.save(`${safeName}-canvas.pdf`);
      toast.success("Canvas exported as PDF");
    } catch (err) {
      console.error("Canvas PDF export error:", err);
      toast.error("Failed to export canvas as PDF");
    } finally {
      setIsExportingCanvas(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share workspace</DialogTitle>
          <DialogDescription>
            Share a read-only link or export workspace content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Public Link Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="public-share-switch"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Public link
                  </Label>
                  {!canShare && (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow anyone with the link to view read-only
                </p>
              </div>
              <Switch
                id="public-share-switch"
                checked={isShared}
                disabled={isUpdatingToken}
                onClick={(e) => {
                  if (!canShare) {
                    e.preventDefault();
                    setOpen(false);
                    openUpgrade(UPGRADE_REASONS.sharing);
                  }
                }}
                onCheckedChange={handleToggleSharing}
              />
            </div>

            {isShared && shareToken && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  readOnly
                  value={shareUrl}
                  className="h-8 text-xs font-mono select-all bg-muted/50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 shrink-0"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span className="sr-only">Copy link</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 shrink-0"
                  disabled={isUpdatingToken}
                  onClick={handleResetToken}
                  title="Reset link (invalidates old link)"
                >
                  {isUpdatingToken ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="size-3.5" />
                  )}
                  <span className="sr-only">Reset link</span>
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Export PDF Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Export as PDF</Label>
              {!canExportPdf && (
                <Lock className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Download high-quality PDF exports of the open panels.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9"
                disabled={!docEditor || isExportingDoc}
                onClick={handleExportDoc}
              >
                {isExportingDoc ? (
                  <Loader2 className="size-4 animate-spin shrink-0" />
                ) : !canExportPdf ? (
                  <Lock className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <FileText className="size-4 shrink-0" />
                )}
                <span className="truncate">Export Doc</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9"
                disabled={!canvasEditor || isExportingCanvas}
                onClick={handleExportCanvas}
              >
                {isExportingCanvas ? (
                  <Loader2 className="size-4 animate-spin shrink-0" />
                ) : !canExportPdf ? (
                  <Lock className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <Palette className="size-4 shrink-0" />
                )}
                <span className="truncate">Export Canvas</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

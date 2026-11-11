import { getWorkspace } from "@/actions/workspaces-actions";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { notFound } from "next/navigation";

type ViewMode = "doc" | "canvas" | "both";

function parseViewMode(value: string | string[] | undefined): ViewMode {
  return (value === "doc" || value === "canvas" ? value : "both") as ViewMode;
}
export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/workspaces/[id]">) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view = parseViewMode(viewParam);

  if (!(await canAccessWorkspace(id))) notFound();
  const workspace = await getWorkspace(id);

  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";
  return <>WorkspacePage</>;
}

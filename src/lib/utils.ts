export { cn } from "cn";

export function submitOnEnter(submit: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    submit();
  };
}

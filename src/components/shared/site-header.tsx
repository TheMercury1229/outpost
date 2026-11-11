import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PlanButton } from "@/components/shared/plan-button";

const navLinks = [
  {
    title: "Product",
    href: "#product",
  },
  {
    title: "How it works",
    href: "#how-it-works",
  },
  {
    title: "Pricing",
    href: "#pricing",
  },
];

const Navbar = () => {
  return (
    <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
      {navLinks.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          className="transition-colors hover:text-foreground"
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export const SiteHeader = () => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const isLandingPage = pathname === "/";
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex h-18 items-center justify-between border-b border-white/6 bg-background/70 px-6 backdrop-blur-md md:px-10">
      <Link
        href={isSignedIn && !isLandingPage ? "/dashboard" : "/"}
        className="flex items-center"
      >
        <Image
          src="/brand/logo-navbar-dark.png"
          alt="Outpost"
          width={314}
          height={160}
          className="h-9 w-auto"
          priority
        />
      </Link>
      {isLandingPage && <Navbar />}
      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Sign up</Button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <OrganizationSwitcher
            afterCreateOrganizationUrl={"/dashboard"}
            afterSelectOrganizationUrl={"/dashboard"}
          />
          {isLandingPage ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <PlanButton />
          )}
          <UserButton />
        </Show>
      </div>
    </header>
  );
};

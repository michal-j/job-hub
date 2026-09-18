import { ThemeSwitcher } from "./ThemeSwitcher";
import { SignOutButton } from "./SignOutButton";

export function AppHeader({ active }: { active: "jobs" | "cv" }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <div className="brand-mark">💼</div>
          <div className="brand-name">Job Hub</div>
        </div>
        <nav className="app-nav">
          <a href="/" className="nav-link" aria-current={active === "jobs" ? "page" : undefined}>
            Jobs
          </a>
          <a href="/cv" className="nav-link" aria-current={active === "cv" ? "page" : undefined}>
            CV
          </a>
          <ThemeSwitcher />
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}

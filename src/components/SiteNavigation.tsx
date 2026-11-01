import { useEffect, useRef, useState, type MouseEvent } from "react";

import type {
  NavigationItem,
  PortfolioSectionId,
} from "../domain/navigation.ts";
import type { SectionNavigationResult } from "../hooks/navigateToSection.ts";

interface SiteNavigationProps {
  readonly items: readonly NavigationItem[];
  readonly onNavigate: (
    target: PortfolioSectionId,
  ) => SectionNavigationResult;
}

export function SiteNavigation({
  items,
  onNavigate,
}: SiteNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeAtDesktopWidth = (): void => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", closeAtDesktopWidth);
    return () => {
      window.removeEventListener("resize", closeAtDesktopWidth);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      openButtonRef.current?.focus();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    target: PortfolioSectionId,
    closeMobilePanel: boolean,
  ): void => {
    event.preventDefault();
    if (closeMobilePanel) {
      setIsOpen(false);
    }
    onNavigate(target);
  };

  return (
    <nav className="site-navigation" aria-label="Primary navigation">
      <ul className="desktop-navigation">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={"#" + item.id}
              onClick={(event) => {
                handleNavigation(event, item.id, false);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mobile-navigation">
        <button
          ref={openButtonRef}
          className="mobile-navigation__toggle"
          type="button"
          aria-label={
            isOpen ? "Close primary navigation" : "Open primary navigation"
          }
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-panel"
          onClick={() => {
            setIsOpen((open) => !open);
          }}
        >
          <span aria-hidden="true">{isOpen ? "Close" : "Open"}</span>
        </button>

        <div
          id="mobile-navigation-panel"
          className="mobile-navigation__panel"
          hidden={!isOpen}
        >
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={"#" + item.id}
                  onClick={(event) => {
                    handleNavigation(event, item.id, true);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

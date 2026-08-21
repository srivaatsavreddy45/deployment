import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/seva-logo.png";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#focus", label: "Our Work" },
  { href: "#impact", label: "Impact" },
  { href: "#get-involved", label: "Get Involved" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 42);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`ssf-navbar ${scrolled ? "ssf-scrolled" : ""}`}>
      <div className="ssf-nav-inner">
        <a href="#top" className="ssf-brand" aria-label="Seva Sahayog Foundation home" onClick={close}>
          <img src={logo} alt="Seva Sahayog Foundation" />
        </a>

        <nav className="ssf-nav-links" aria-label="Main navigation">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="ssf-nav-actions">
          <Link to="/login" className="ssf-nav-login">Login</Link>
        </div>

        <button
          className="ssf-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`ssf-mobile-panel ${open ? "ssf-open" : ""}`}>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>{link.label}</a>
        ))}
        <Link to="/login" className="ssf-mobile-login" onClick={close}>Login</Link>
      </div>
    </header>
  );
}

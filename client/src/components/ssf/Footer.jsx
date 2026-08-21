import { Link } from "react-router-dom";
import logo from "../../assets/seva-logo.png";

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/sevasahayog/" },
  { label: "Facebook", href: "https://www.facebook.com/sevasahayog/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/sevasahayog/" },
  { label: "YouTube", href: "https://www.youtube.com/@sevasahayog" },
];

export default function Footer() {
  return (
    <footer className="ssf-footer">
      <div className="ssf-footer-top ssf-wrap">
        <div className="ssf-footer-brand">
          <a href="#top" className="ssf-footer-logo">
            <img src={logo} alt="Seva Sahayog Foundation" />
          </a>
          <p>
            A volunteer-driven foundation working with communities, organisations and
            socially conscious people to create meaningful change.
          </p>
          <div className="ssf-social-row">
            {SOCIALS.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div className="ssf-footer-col">
          <h3>Explore</h3>
          <a href="#about">About us</a>
          <a href="#focus">Our work</a>
          <a href="#impact">Impact</a>
          <a href="#get-involved">Get involved</a>
          <a href="https://sevasahayog.org/gallery/" target="_blank" rel="noreferrer">Gallery</a>
        </div>

        <div className="ssf-footer-col">
          <h3>Connect</h3>
          <a href="https://sevasahayog.org/contact-us/" target="_blank" rel="noreferrer">Contact us</a>
          <a href="mailto:pune@sevasahayog.com">pune@sevasahayog.com</a>
          <a href="mailto:mumbai@sevasahayog.com">mumbai@sevasahayog.com</a>
          <span>Pune · Mumbai · Maharashtra</span>
        </div>

        <div className="ssf-footer-col ssf-footer-action">
          <h3>Volunteer experience</h3>
          <p>Access the volunteer platform through your account.</p>
          <Link to="/login" className="ssf-footer-login">Login to platform <span aria-hidden="true">→</span></Link>
        </div>
      </div>

      <div className="ssf-footer-bottom">
        <div className="ssf-wrap">
          <span>© {new Date().getFullYear()} Seva Sahayog Foundation</span>
          <div>
            <a href="https://sevasahayog.org/privacy-policy/" target="_blank" rel="noreferrer">Privacy</a>
            <a href="https://sevasahayog.org/terms-and-conditions/" target="_blank" rel="noreferrer">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

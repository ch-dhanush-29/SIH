/**
 * Footer.jsx
 */
import { siteCopy } from '../content/copy.js'

export default function Footer() {
  const { footer } = siteCopy

  return (
    <footer className="section-dark border-t border-mist/10" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start gap-8 justify-between mb-10">

          {/* Brand */}
          <div>
            <p className="font-display text-xl font-bold text-paper mb-1">
              <span className="text-saffron">Medi</span>Kiosk
            </p>
            <p className="font-sans text-sm text-paper/45">{footer.tagline}</p>
          </div>

          {/* Reference links */}
          <nav aria-label="Reference links">
            <p className="font-mono text-data text-mist/40 uppercase tracking-widest mb-3">
              External References
            </p>
            <ul className="flex flex-col gap-2 list-none">
              {footer.links.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-paper/50 hover:text-saffron transition-colors underline underline-offset-2"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-mist/10 pt-8">
          <p className="font-mono text-data text-paper/30 leading-relaxed max-w-2xl">
            {footer.legal}
          </p>
        </div>
      </div>
    </footer>
  )
}

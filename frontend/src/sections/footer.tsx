import logoWhite from "@/assets/brand/deeppatient-logo-white.svg";

const footerLinks = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Contact", href: "#top" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="border-t border-white/8 bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoWhite} alt="DeepPatient" className="h-7 w-7" />
              <span className="text-lg font-bold text-white">DeepPatient</span>
            </div>
            <p className="text-white/45 text-sm leading-relaxed">
              AI patient practice and feedback for clinical training programs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 md:gap-16">
            {footerLinks.map((col) => (
              <div key={col.heading} className="min-w-24">
                <h4 className="text-sm font-semibold text-white mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/45 transition-colors hover:text-white/80"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-center border-t border-white/8 pt-8">
          <span className="text-white/35 text-xs">
            © {year} DeepPatient. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export { Footer };

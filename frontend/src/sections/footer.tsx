import logoWhite from "@/assets/brand/deeppatient-logo-white.svg";

const footerLinks = [
  {
    heading: "Product",
    links: ["Features", "Pricing", "Demo"],
  },
  {
    heading: "Company",
    links: ["About", "Contact"],
  },
  {
    heading: "Legal",
    links: ["Privacy", "Terms", "Security"],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/5 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoWhite} alt="DeepPatient" className="h-7 w-7" />
              <span className="text-lg font-bold text-white">DeepPatient</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI-powered clinical skills training for medical institutions.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-gray-600 text-xs">
            \u00A9 {year} DeepPatient. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };

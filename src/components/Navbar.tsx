import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarProps {
  links?: NavLink[];
  productName?: string;
  productLinks?: NavLink[];
  ctaText?: string;
  onCtaClick?: () => void;
}

const defaultProductLinks: NavLink[] = [
  { label: 'Library', href: '#library' },
  { label: 'Bookmarks', href: '#bookmarks' },
  { label: 'Dictionary', href: '#dictionary' },
];

const NavLinkItem: React.FC<{
  link: NavLink;
  className?: string;
  onClick?: () => void;
}> = ({ link, className = '', onClick }) => {
  if (link.href.startsWith('/')) {
    return (
      <Link to={link.href} onClick={onClick} className={`hover:text-white transition-colors duration-300 ${className}`}>
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      onClick={onClick}
      className={`hover:text-white transition-colors duration-300 ${className}`}
    >
      {link.label}
    </a>
  );
};

const Navbar: React.FC<NavbarProps> = ({
  productName = 'Book Reader',
  productLinks = defaultProductLinks,
  ctaText = 'Read Now',
  onCtaClick,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const productNavLinks = productLinks;


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="w-full flex flex-col font-sans select-none antialiased">
      <div
        className={`w-full h-[52px] bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-center px-4 transition-all duration-300 z-30 sticky top-0 ${
          scrolled ? 'shadow-lg border-neutral-800/80' : 'border-neutral-800/40'
        }`}
      >
        <div className="w-full max-w-[1024px] flex items-center justify-between">
          <a
            href="#"
            className="text-neutral-100 text-[19px] md:text-[21px] font-semibold tracking-tight transition-colors duration-200 hover:text-neutral-300"
          >
            {productName}
          </a>

          <div className="flex items-center gap-x-4 md:gap-x-6">
            <div className="hidden sm:flex items-center gap-x-5 text-xs text-neutral-400 font-light">
              {productNavLinks.map((link) => (
                <NavLinkItem
                  key={`${link.href}-${link.label}`}
                  link={link}
                  className="hover:text-sky-400"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onCtaClick}
              className="rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-normal text-white shadow-sm transition-all duration-200 hover:bg-sky-400 active:scale-95"
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

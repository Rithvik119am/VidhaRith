import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if window is defined (for SSR compatibility)
      if (typeof window !== 'undefined') {
        if (window.scrollY > 10) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    // Check if window is defined before adding event listener
    if (typeof window !== 'undefined') {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Close mobile menu on window resize (useful if resizing from mobile to desktop)
  useEffect(() => {
    const handleResize = () => {
        // 768px is Tailwind's 'md' breakpoint
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setMobileMenuOpen(false);
        }
    };

     if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, []);


  // Determine navbar classes based on state
  // Use `h-[theme('spacing.16')]` or a fixed pixel value like `h-[64px]`
  // to ensure the header has a predictable height, especially when not scrolled.
  // This makes positioning the mobile menu below it easier.
  // Let's use a fixed height for clarity in this example, assuming 64px (4rem)
  const headerBaseHeight = 'h-[64px]'; // A consistent height for the header bar
  const headerPaddingScrolled = 'py-3'; // Tighter padding when scrolled
  const headerPaddingDefault = 'py-4'; // Default padding

  const navbarClasses = `fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${headerBaseHeight}`;

  const activeNavbarClasses = isScrolled
    ? `${navbarClasses} bg-white/95 shadow-sm backdrop-blur-sm ${headerPaddingScrolled}`
    : mobileMenuOpen
      ? `${navbarClasses} bg-white/95 shadow-sm ${headerPaddingDefault}` // Add background when mobile menu open, but keep default padding
      : `${navbarClasses} bg-transparent ${headerPaddingDefault}`; // Transparent background by default


  // Calculate the height of the header bar when not scrolled to position mobile menu
  // This should match the headerBaseHeight + potential top/bottom borders if any.
  // If using h-[64px] and py-4, the total visual height might be slightly more than 64px due to padding inside the fixed height element.
  // A simple fixed value matching headerBaseHeight often works best for positioning the menu below.
  const mobileMenuTop = 'top-[64px]'; // Position the menu below the 64px header


  return (
    <>
      <nav className={activeNavbarClasses}>
        {/* Use `h-full` to make items center vertically within the fixed height nav */}
        <div className="container mx-auto px-4 flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-xl md:text-2xl font-display font-bold text-quiz-primary">
              Vidha<span className="text-quiz-secondary">Rith</span>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-quiz-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-foreground hover:text-quiz-primary transition-colors">
              How it Works
            </a>
            {/*<a href="#pricing" className="text-foreground hover:text-quiz-primary transition-colors">
              Pricing
            </a>*/}

            {/* Auth Buttons/Links - Styled as buttons */}
            <Unauthenticated>
              <a
                href="/sign-in" // Or your sign-in route/modal trigger
                className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-2 rounded-md transition-all"
              >
                Get Started
              </a>
            </Unauthenticated>
            <Authenticated>
              <a
                href="/dashboard/forms"
                 className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-2 rounded-md transition-all"
              >
                Dashboard
              </a>
            </Authenticated>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground p-2 focus:outline-none focus:ring-2 focus:ring-quiz-primary rounded-md"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay (Full Screen Below Header) */}
      {/* This div covers the screen area BELOW the header when mobileMenuOpen is true */}
      <div
        className={`fixed inset-0 md:hidden bg-white z-40 transition-opacity duration-300 ease-in-out overflow-y-auto ${mobileMenuTop}
           ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
         }
      >
         {/* Inner div for padding and to stop propagation */}
        <div className="flex flex-col space-y-6 p-8 text-center text-lg h-full" onClick={(e) => e.stopPropagation()}>
          {/* Optional: Add logo here as well for consistency if desired */}
          {/* <div className="mb-4">
             <a href="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-display font-bold text-quiz-primary">
                Vidha<span className="text-quiz-secondary">Rith</span>
              </a>
            </div> */}

          {/* Mobile Links */}
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-foreground hover:text-quiz-primary transition-colors py-2"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-foreground hover:text-quiz-primary transition-colors py-2"
          >
            How it Works
          </a>
          {/*<a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-foreground hover:text-quiz-primary transition-colors py-2"
          >
            Pricing
          </a>*/}

          {/* Auth Buttons/Links - Styled as buttons */}
          <Unauthenticated>
            <a
              href="/sign-in" // Or your sign-in route/modal trigger
              onClick={() => setMobileMenuOpen(false)}
              className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-3 rounded-md transition-all mx-auto w-fit"
            >
              Get Started
            </a>
          </Unauthenticated>
          <Authenticated>
            <a
              href="/dashboard/forms"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-3 rounded-md transition-all mx-auto w-fit"
            >
              Dashboard
            </a>
          </Authenticated>
        </div>
      </div>

       {/* Optional: Add a semi-transparent backdrop */}
       {/* This backdrop also covers the screen below the header */}
       <div
            className={`fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden transition-opacity duration-300 ease-in-out ${mobileMenuTop}
                ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
            }
            onClick={() => setMobileMenuOpen(false)} // Click backdrop to close menu
        ></div>
    </>
  );
};

export default Navbar;
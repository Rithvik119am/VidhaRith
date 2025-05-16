import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > 10) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setMobileMenuOpen(false);
        }
    };

     if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, []);


  const headerBaseHeight = 'h-[64px]';
  const headerPaddingScrolled = 'py-3';
  const headerPaddingDefault = 'py-4';

  const navbarClasses = `fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${headerBaseHeight}`;

  const activeNavbarClasses = isScrolled
    ? `${navbarClasses} bg-white/95 shadow-sm backdrop-blur-sm ${headerPaddingScrolled}`
    : mobileMenuOpen
      ? `${navbarClasses} bg-white/95 shadow-sm ${headerPaddingDefault}`
      : `${navbarClasses} bg-transparent ${headerPaddingDefault}`;


  const mobileMenuTop = 'top-[64px]';


  return (
    <>
      <nav className={activeNavbarClasses}>
        <div className="container mx-auto px-4 flex justify-between items-center h-full">
          <div className="flex items-center">
            <a href="/" className="text-xl md:text-2xl font-display font-bold text-quiz-primary">
              Vidha<span className="text-quiz-secondary">Rith</span>
            </a>
          </div>

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

            <Unauthenticated>
              <a
                href="/sign-in"
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

      <div
        className={`fixed inset-0 md:hidden bg-white z-40 transition-opacity duration-300 ease-in-out overflow-y-auto ${mobileMenuTop}
           ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
         }
      >
        <div className="flex flex-col space-y-6 p-8 text-center text-lg h-full" onClick={(e) => e.stopPropagation()}>
          {/* <div className="mb-4">
             <a href="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-display font-bold text-quiz-primary">
                Vidha<span className="text-quiz-secondary">Rith</span>
              </a>
            </div> */}

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

          <Unauthenticated>
            <a
              href="/sign-in"
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

      <div
            className={`fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden transition-opacity duration-300 ease-in-out ${mobileMenuTop}
                ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
            }
            onClick={() => setMobileMenuOpen(false)}
        ></div>
    </>
  );
};

export default Navbar;

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Authenticated,Unauthenticated } from "convex/react";
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 shadow-sm backdrop-blur-sm py-3" : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="text-xl md:text-2xl font-display font-bold text-quiz-primary">
            QuizGenie<span className="text-quiz-secondary">Reports</span>
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
          <a href="#pricing" className="text-foreground hover:text-quiz-primary transition-colors">
            Pricing
          </a>
          <Unauthenticated>
          <button className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-2 rounded-md transition-all">
            Get Started
          </button>
          </Unauthenticated>
          <Authenticated>
          <button className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-2 rounded-md transition-all"
          onClick={() => window.location.href = '/dashboard/forms'}
          >
            Dashboard
          </button>
          </Authenticated>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-40 md:hidden">
          <div className="flex flex-col space-y-6 p-8 text-center text-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:text-quiz-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:text-quiz-primary transition-colors"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:text-quiz-primary transition-colors"
            >
              Pricing
            </a>
            <button className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-6 py-3 rounded-md transition-all mx-auto">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

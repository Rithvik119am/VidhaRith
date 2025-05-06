
import CTAButton from "./CTAButton";

const Footer = () => {
  return (
    <footer>
      <div className="bg-quiz-dark text-white">
        <div className="container py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Ready to Transform Your Teaching Approach?
            </h2>
            <p className="text-white/80 mb-8">
              Join educators around the world who are using Quiz Genie Reports to identify knowledge gaps and improve student outcomes.
            </p>
            <CTAButton variant="secondary" size="lg" className="mx-auto">
              Get Started For Free
            </CTAButton>
          </div>
        </div>
      </div>

      <div className="bg-quiz-dark/95 text-white py-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h3 className="font-display font-bold text-xl mb-4">
                QuizGenie<span className="text-quiz-secondary">Reports</span>
              </h3>
              <p className="text-white/70 text-sm">
                Helping educators identify knowledge gaps with intelligent quiz analysis.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#features" className="hover:text-quiz-secondary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-quiz-secondary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">Case Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-quiz-secondary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Quiz Genie Reports. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-white/60 hover:text-quiz-secondary transition-colors">
                Twitter
              </a>
              <a href="#" className="text-white/60 hover:text-quiz-secondary transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-white/60 hover:text-quiz-secondary transition-colors">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

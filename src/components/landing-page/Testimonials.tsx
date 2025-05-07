
import { cn } from "@/lib/utils";
import Image from "next/image"
interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  image?: string;
  className?: string;
}

const Testimonial = ({ quote, name, title, image, className }: TestimonialProps) => (
  <div className={cn(
    "bg-white p-6 rounded-xl shadow-sm border border-border",
    className
  )}>
    <div className="mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-yellow-400">★</span>
      ))}
    </div>
    <p className="mb-6 text-foreground/80 italic">&ldquo;{quote}&ldquo;</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-quiz-primary font-bold mr-3">
        {image ? (
          <Image src={image} alt={name} className="w-full h-full object-cover rounded-full" width={500}
          height={300} />
        ) : (
          name.charAt(0)
        )}
      </div>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    </div>
  </div>
);

const Testimonials = () => {
  const testimonials = [
    {
      quote: "VidhaRith has transformed how I identify gaps in my students' understanding. The insights are incredibly valuable for adjusting my teaching strategies.",
      name: "Sarah Johnson",
      title: "High School Science Teacher"
    },
    {
      quote: "The automatic quiz generation saves me hours of work each week. I can focus more on addressing the specific needs of my students based on the detailed reports.",
      name: "Michael Chen",
      title: "University Professor"
    },
    {
      quote: "I've seen significant improvement in my students' test scores since implementing VidhaRith. The targeted teaching based on quiz results has been a game-changer.",
      name: "Jessica Rodriguez",
      title: "Middle School Math Teacher"
    }
  ];

  return (
    <section className="section bg-gradient-to-b from-white to-secondary/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-4">
            What Educators Are <span className="gradient-text">Saying</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join hundreds of educators who have transformed their teaching approach with VidhaRith.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              title={testimonial.title}
              className={`animate-fade-in [animation-delay:${index * 0.1}s]`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;


import React from "react";
import { 
  HeroParallax, 
  GridPattern, 
  SparklesCore,
  TextGenerateEffect,
  WavyBackground,
  AnimatedTooltip,
  InfiniteMovingCards
} from "aceternity-ui/components";

const products = [
  {
    title: "AI Agents",
    link: "/dashboard/agents",
    thumbnail: "https://images.unsplash.com/photo-1682687982141-0143020ed57a?q=80&w=2787&auto=format&fit=crop"
  },
  {
    title: "Lead Management",
    link: "/dashboard/leads",
    thumbnail: "https://images.unsplash.com/photo-1664575599736-c5197c684128?q=80&w=2940&auto=format&fit=crop"
  },
  {
    title: "Pipeline Automation",
    link: "/dashboard/pipelines",
    thumbnail: "https://images.unsplash.com/photo-1678995632928-318910baf46a?q=80&w=2942&auto=format&fit=crop"
  },
  {
    title: "Knowledge Base",
    link: "/dashboard/knowledge",
    thumbnail: "https://images.unsplash.com/photo-1626266061368-46a8632bac04?q=80&w=2940&auto=format&fit=crop"
  },
];

const team = [
  {
    id: 1,
    name: "John Smith",
    designation: "CEO",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=3387&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Emily Davis",
    designation: "CTO",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3261&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Michael Johnson",
    designation: "Product Manager",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2662&auto=format&fit=crop"
  }
];

const testimonials = [
  {
    quote: "This platform has completely transformed our sales process. Our team is closing deals faster than ever.",
    name: "Sarah Johnson",
    title: "VP of Sales, TechCorp"
  },
  {
    quote: "The AI agents feel like real team members. They've helped us scale our outreach without losing the personal touch.",
    name: "David Chen",
    title: "Marketing Director, GrowthCo"
  },
  {
    quote: "Implementation was smooth, and the ROI has been incredible. Highly recommend to any growing business.",
    name: "Lisa Rodriguez",
    title: "COO, StartupX"
  },
  {
    quote: "The pipeline visualization makes it so easy to track deals and forecast accurately. Game changer!",
    name: "Thomas Wright",
    title: "Sales Manager, EnterpriseB"
  },
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Sparkles */}
      <div className="relative h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
            <TextGenerateEffect words="Transform Your Business With AI" />
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto">
            Boost your sales and customer engagement with our AI-powered platform
          </p>
          <div className="mt-10">
            <a 
              href="/auth" 
              className="bg-white text-black px-8 py-3 rounded-md text-lg font-medium mr-4 hover:bg-opacity-90 transition"
            >
              Get Started
            </a>
            <a 
              href="#features" 
              className="border border-white text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-white hover:bg-opacity-10 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Features Section with Grid Pattern */}
      <div id="features" className="relative py-20">
        <GridPattern
          width={40}
          height={40}
          className="absolute inset-0 h-full w-full text-white/[0.2] [mask-image:radial-gradient(white,transparent_85%)]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Powerful Features</h2>
          <HeroParallax products={products} />
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Meet Our Team</h2>
          <div className="flex flex-wrap justify-center gap-10">
            <AnimatedTooltip items={team} />
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <WavyBackground className="max-w-full py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">What Our Customers Say</h2>
          <div className="relative h-40">
            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
              pauseOnHover={true}
              className="max-w-full pb-10"
            />
          </div>
        </div>
      </WavyBackground>

      {/* CTA Section */}
      <div className="py-20 bg-black">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-gray-400 text-xl mb-10">
            Join thousands of companies using our platform to grow faster and smarter.
          </p>
          <a 
            href="/auth" 
            className="bg-white text-black px-8 py-3 rounded-md text-lg font-medium hover:bg-opacity-90 transition"
          >
            Get Started Today
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-gray-500 text-sm">© 2023 AI Sales Platform. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

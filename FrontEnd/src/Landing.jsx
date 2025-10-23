import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sprout, Users, TrendingUp, MessageSquare } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-800">AgroConnect</h1>
          </div>
          <Button 
            data-testid="header-get-started-btn"
            onClick={() => navigate('/auth')} 
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-900 mb-6">
            Direct Connection Between <span className="text-emerald-600">Farmers</span> & <span className="text-emerald-600">Buyers</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Eliminate middlemen, get fair prices, and build direct relationships. AgroConnect brings transparency to agricultural trade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              data-testid="hero-farmer-btn"
              onClick={() => navigate('/auth')} 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
            >
              I'm a Farmer
            </Button>
            <Button 
              data-testid="hero-buyer-btn"
              onClick={() => navigate('/auth')} 
              size="lg" 
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-lg px-8"
            >
              I'm a Buyer
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-emerald-900 mb-12">Key Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<Sprout className="w-10 h-10 text-emerald-600" />}
            title="Post Your Crops"
            description="Farmers can easily list their produce with details, images, and pricing."
          />
          <FeatureCard 
            icon={<Users className="w-10 h-10 text-emerald-600" />}
            title="Direct Contact"
            description="Buyers connect directly with farmers without any intermediaries."
          />
          <FeatureCard 
            icon={<TrendingUp className="w-10 h-10 text-emerald-600" />}
            title="Market Prices"
            description="Real-time market price tracking helps farmers set fair rates."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-10 h-10 text-emerald-600" />}
            title="Multilingual"
            description="Available in English, Hindi, and Telugu for easy access."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-emerald-100">© 2025 AgroConnect. Empowering farmers, connecting markets.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-emerald-100">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-emerald-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default Landing;
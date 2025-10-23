import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Sprout, LogOut, Search, MapPin, Phone, MessageSquare, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function BuyerDashboard({ user, token, onLogout }) {
  const [crops, setCrops] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [searchType, setSearchType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [message, setMessage] = useState('');
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cropsRes, pricesRes] = await Promise.all([
        axios.get(`${API}/crops`),
        axios.get(`${API}/market-prices`)
      ]);
      setCrops(cropsRes.data);
      setMarketPrices(pricesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchType) params.append('crop_type', searchType);
      if (searchLocation) params.append('location', searchLocation);
      
      const response = await axios.get(`${API}/crops?${params.toString()}`);
      setCrops(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await axios.post(`${API}/messages`, {
        crop_id: selectedCrop.id,
        farmer_id: selectedCrop.farmer_id,
        message: message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Message sent successfully!');
      setShowContact(false);
      setMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-emerald-800">AgroConnect</h1>
              <p className="text-xs text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>
          <Button data-testid="logout-btn" onClick={onLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    data-testid="search-crop-input"
                    placeholder="Search crop type (e.g., Wheat, Rice)"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    data-testid="search-location-input"
                    placeholder="Location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1"
                  />
                  <Button data-testid="search-btn" onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Crops List */}
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">Available Crops</h2>
              <div className="space-y-4" data-testid="crops-list">
                {crops.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No crops found. Try adjusting your search.
                    </CardContent>
                  </Card>
                ) : (
                  crops.map((crop) => (
                    <Card key={crop.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-emerald-900">{crop.crop_type}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {crop.farmer_location}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Available</Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-2xl font-bold text-emerald-700">₹{crop.price}/{crop.unit}</p>
                          <p className="text-sm font-medium text-gray-700">Quantity: {crop.quantity} {crop.unit}</p>
                          <p className="text-sm text-gray-700">{crop.description}</p>
                          <p className="text-sm text-gray-600">Harvest Date: {crop.expected_harvest_date}</p>
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Farmer Details:</p>
                          <p className="text-sm text-gray-600">{crop.farmer_name}</p>
                          <div className="flex gap-2">
                            <Button
                              data-testid={`call-farmer-${crop.id}-btn`}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => window.open(`tel:${crop.farmer_phone}`)}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call: {crop.farmer_phone}
                            </Button>
                            <Button
                              data-testid={`message-farmer-${crop.id}-btn`}
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => {
                                setSelectedCrop(crop);
                                setShowContact(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Market Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {marketPrices.map((price) => (
                  <div key={price.id} className="flex justify-between items-center pb-2 border-b last:border-0">
                    <span className="text-sm font-medium text-gray-700">{price.crop_type}</span>
                    <span className="text-sm font-bold text-emerald-700">₹{price.price}/{price.unit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Farmer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Your Message</Label>
              <Textarea
                data-testid="message-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I'm interested in your crops..."
                rows={5}
              />
            </div>
            <Button data-testid="send-message-btn" onClick={handleSendMessage} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BuyerDashboard;
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Sprout, LogOut, Plus, Trash2, MessageSquare, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function FarmerDashboard({ user, token, onLogout }) {
  const [crops, setCrops] = useState([]);
  const [messages, setMessages] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cropForm, setCropForm] = useState({
    crop_type: '',
    quantity: '',
    unit: 'quintal',
    price: '',
    expected_harvest_date: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cropsRes, messagesRes, pricesRes] = await Promise.all([
        axios.get(`${API}/crops/my-crops`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/messages/received`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/market-prices`)
      ]);
      setCrops(cropsRes.data);
      setMessages(messagesRes.data);
      setMarketPrices(pricesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/crops`, {
        ...cropForm,
        quantity: parseFloat(cropForm.quantity),
        price: parseFloat(cropForm.price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Crop added successfully!');
      setShowAddCrop(false);
      setCropForm({
        crop_type: '',
        quantity: '',
        unit: 'quintal',
        price: '',
        expected_harvest_date: '',
        description: '',
        image: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add crop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    try {
      await axios.delete(`${API}/crops/${cropId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Crop deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete crop');
    }
  };

  const handleStatusChange = async (cropId, newStatus) => {
    try {
      await axios.put(`${API}/crops/${cropId}/status?status=${newStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Status updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
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
            {/* Add Crop Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-emerald-900">My Crops</h2>
              <Dialog open={showAddCrop} onOpenChange={setShowAddCrop}>
                <DialogTrigger asChild>
                  <Button data-testid="add-crop-btn" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Crop</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCrop} className="space-y-4">
                    <div>
                      <Label>Crop Type</Label>
                      <Input
                        data-testid="crop-type-input"
                        value={cropForm.crop_type}
                        onChange={(e) => setCropForm({ ...cropForm, crop_type: e.target.value })}
                        placeholder="e.g., Wheat, Rice, Cotton"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          data-testid="quantity-input"
                          type="number"
                          step="0.01"
                          value={cropForm.quantity}
                          onChange={(e) => setCropForm({ ...cropForm, quantity: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Select value={cropForm.unit} onValueChange={(value) => setCropForm({ ...cropForm, unit: value })}>
                          <SelectTrigger data-testid="unit-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">KG</SelectItem>
                            <SelectItem value="quintal">Quintal</SelectItem>
                            <SelectItem value="ton">Ton</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Price per {cropForm.unit}</Label>
                      <Input
                        data-testid="price-input"
                        type="number"
                        step="0.01"
                        value={cropForm.price}
                        onChange={(e) => setCropForm({ ...cropForm, price: e.target.value })}
                        placeholder="₹"
                        required
                      />
                    </div>
                    <div>
                      <Label>Expected Harvest Date</Label>
                      <Input
                        data-testid="harvest-date-input"
                        type="date"
                        value={cropForm.expected_harvest_date}
                        onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        data-testid="description-input"
                        value={cropForm.description}
                        onChange={(e) => setCropForm({ ...cropForm, description: e.target.value })}
                        placeholder="Quality, variety, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label>Image URL (optional)</Label>
                      <Input
                        data-testid="image-input"
                        value={cropForm.image}
                        onChange={(e) => setCropForm({ ...cropForm, image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <Button data-testid="submit-crop-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                      {loading ? 'Adding...' : 'Add Crop'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Crops List */}
            <div className="space-y-4" data-testid="crops-list">
              {crops.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    No crops listed yet. Click "Add Crop" to get started!
                  </CardContent>
                </Card>
              ) : (
                crops.map((crop) => (
                  <Card key={crop.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-emerald-900">{crop.crop_type}</h3>
                          <p className="text-sm text-gray-600">{crop.quantity} {crop.unit}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={crop.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {crop.status}
                          </Badge>
                          <Button
                            data-testid={`delete-crop-${crop.id}-btn`}
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCrop(crop.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-emerald-700">₹{crop.price}/{crop.unit}</p>
                        <p className="text-sm text-gray-700">{crop.description}</p>
                        <p className="text-sm text-gray-600">Harvest: {crop.expected_harvest_date}</p>
                      </div>
                      <div className="mt-4">
                        <Select value={crop.status} onValueChange={(value) => handleStatusChange(crop.id, value)}>
                          <SelectTrigger data-testid={`status-select-${crop.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Prices */}
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

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  Recent Inquiries ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3" data-testid="messages-list">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No inquiries yet</p>
                ) : (
                  messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="bg-emerald-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-emerald-900">{msg.buyer_name}</p>
                      <p className="text-xs text-gray-600">{msg.buyer_phone}</p>
                      <p className="text-sm text-gray-700 mt-1">{msg.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;
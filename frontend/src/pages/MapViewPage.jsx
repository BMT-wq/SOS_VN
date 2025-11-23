import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MapViewPage() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await axios.get(`${API}/sos/signals`);
      setSignals(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast.error('Không thể tải dữ liệu');
      setLoading(false);
    }
  };

  const getDangerColor = (level) => {
    switch (level) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDangerLabel = (level) => {
    switch (level) {
      case 'red': return 'Nguy hiểm cao';
      case 'yellow': return 'Trung bình';
      case 'green': return 'An toàn';
      default: return 'Chưa xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          data-testid="back-home-btn"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Trang chủ
        </Button>

        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bản đồ tình huống</h1>
            <p className="text-gray-600">Xem các tín hiệu SOS trên toàn quốc</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-2xl font-bold text-red-700">
                    {signals.filter(s => s.danger_level === 'red').length}
                  </p>
                  <p className="text-sm text-red-600">Nguy hiểm cao</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {signals.filter(s => s.danger_level === 'yellow').length}
                  </p>
                  <p className="text-sm text-yellow-600">Trung bình</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {signals.filter(s => s.danger_level === 'green').length}
                  </p>
                  <p className="text-sm text-green-600">An toàn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="aspect-video bg-gray-100 rounded-xl border-2 border-gray-300 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Bản đồ Việt Nam</p>
                <p className="text-sm text-gray-400">(Google Maps API sẽ được tích hợp)</p>
              </div>
            </div>
            
            {/* Mock markers */}
            {signals.slice(0, 10).map((signal, index) => (
              <div
                key={signal.id}
                data-testid={`signal-marker-${signal.id}`}
                className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${getDangerColor(signal.danger_level)}`}
                style={{
                  left: `${20 + (index * 7)}%`,
                  top: `${30 + (index % 5) * 10}%`
                }}
                onClick={() => setSelectedSignal(signal)}
              />
            ))}
          </div>

          {/* Signals List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Danh sách tín hiệu gần đây</h3>
            {loading ? (
              <p className="text-gray-500 text-center py-8">Đang tải...</p>
            ) : signals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có tín hiệu nào</p>
            ) : (
              <div className="grid gap-3">
                {signals.slice(0, 10).map((signal) => (
                  <div
                    key={signal.id}
                    data-testid={`signal-item-${signal.id}`}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/track/${signal.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${getDangerColor(signal.danger_level)}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-900">{getDangerLabel(signal.danger_level)}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{signal.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{signal.latitude.toFixed(4)}, {signal.longitude.toFixed(4)}</span>
                          <span className="ml-auto px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {signal.status === 'pending' && 'Chờ xử lý'}
                            {signal.status === 'in_progress' && 'Đang cứu hộ'}
                            {signal.status === 'completed' && 'Hoàn thành'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
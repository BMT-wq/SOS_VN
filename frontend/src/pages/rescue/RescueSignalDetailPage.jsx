import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Clock, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RescueSignalDetailPage() {
  const { signalId } = useParams();
  const navigate = useNavigate();
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [trackingLocation, setTrackingLocation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('rescue_token');
    if (!token) {
      toast.error('Vui lòng đăng nhập');
      navigate('/rescue/login');
      return;
    }
    fetchSignal();
  }, [signalId]);

  const fetchSignal = async () => {
    try {
      const response = await axios.get(`${API}/sos/signals/${signalId}`);
      setSignal(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching signal:', error);
      toast.error('Không tìm thấy tín hiệu');
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('rescue_token');
      await axios.put(
        `${API}/sos/signals/${signalId}/status`,
        { status: newStatus, notes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật trạng thái thành công');
      fetchSignal();
      setNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setTrackingLocation(true);
    toast.success('Đã bắt đầu theo dõi vị trí');

    // Update location every 10 seconds
    const trackingInterval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem('rescue_token');
            await axios.post(
              `${API}/rescue/location`,
              {
                signal_id: signalId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }, 10000);

    // Store interval ID to clear later
    window.trackingInterval = trackingInterval;
  };

  const stopTracking = () => {
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
    setTrackingLocation(false);
    toast.info('Đã dừng theo dõi vị trí');
  };

  useEffect(() => {
    return () => {
      if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy tín hiệu</p>
          <Button onClick={() => navigate('/rescue/signals')} className="mt-4">Quay lại</Button>
        </div>
      </div>
    );
  }

  const getDangerColor = (level) => {
    switch (level) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          data-testid="back-signals-btn"
          variant="ghost"
          onClick={() => navigate('/rescue/signals')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Danh sách tín hiệu
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Signal Info */}
            <div className="glass-card rounded-3xl p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getDangerColor(signal.danger_level)}`}></div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Mức độ {signal.danger_level === 'red' ? 'Cao' : signal.danger_level === 'yellow' ? 'Trung bình' : 'Thấp'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(signal.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                  {signal.status === 'pending' && 'Chờ xử lý'}
                  {signal.status === 'in_progress' && 'Đang cứu hộ'}
                  {signal.status === 'completed' && 'Hoàn thành'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả tình huống</h3>
                <p className="text-gray-700 whitespace-pre-line">{signal.description}</p>
              </div>

              {/* Images */}
              {signal.images_base64 && signal.images_base64.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Hình ảnh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {signal.images_base64.map((img, index) => (
                      <img
                        key={index}
                        src={`data:image/jpeg;base64,${img}`}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Assessment */}
              {signal.ai_assessment && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Đánh giá từ AI
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{signal.ai_assessment}</p>
                </div>
              )}

              {/* Location */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Vị trí
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Latitude: {signal.latitude}</p>
                  <p>Longitude: {signal.longitude}</p>
                  <a
                    href={`https://www.google.com/maps?q=${signal.latitude},${signal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-600 hover:underline"
                  >
                    Mở Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Hành động</h3>

              {signal.status === 'pending' && (
                <Button
                  data-testid="accept-rescue-btn"
                  onClick={() => updateStatus('in_progress')}
                  disabled={updating}
                  className="w-full bg-green-600 hover:bg-green-700 btn-transition"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tiếp nhận cứu hộ
                </Button>
              )}

              {signal.status === 'in_progress' && (
                <>
                  <Button
                    data-testid="complete-rescue-btn"
                    onClick={() => updateStatus('completed')}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700 btn-transition"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Hoàn thành cứu hộ
                  </Button>

                  {!trackingLocation ? (
                    <Button
                      data-testid="start-tracking-btn"
                      onClick={startTracking}
                      variant="outline"
                      className="w-full btn-transition"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Bắt đầu theo dõi
                    </Button>
                  ) : (
                    <Button
                      data-testid="stop-tracking-btn"
                      onClick={stopTracking}
                      variant="outline"
                      className="w-full btn-transition border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Dừng theo dõi
                    </Button>
                  )}
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  data-testid="notes-input"
                  placeholder="Thêm ghi chú về quá trình cứu hộ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Info */}
            <div className="glass-card rounded-3xl p-6 space-y-3 text-sm">
              <h3 className="font-semibold text-gray-900">Thông tin</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Mã tín hiệu:</span> {signal.id.slice(0, 8)}</p>
                <p><span className="font-medium">Thời gian gửi:</span> {new Date(signal.created_at).toLocaleString('vi-VN')}</p>
                <p><span className="font-medium">Cập nhật:</span> {new Date(signal.updated_at).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
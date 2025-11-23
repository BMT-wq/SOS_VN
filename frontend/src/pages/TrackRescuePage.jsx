import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TrackRescuePage() {
  const { signalId } = useParams();
  const navigate = useNavigate();
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignal();
    const interval = setInterval(fetchSignal, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy tín hiệu</p>
          <Button onClick={() => navigate('/')} className="mt-4">Quay lại trang chủ</Button>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (signal.status) {
      case 'pending':
        return {
          icon: <Clock className="w-12 h-12 text-orange-500" />,
          title: 'Chờ xử lý',
          description: 'Đội cứu hộ đang xác nhận tín hiệu của bạn',
          color: 'bg-orange-100 text-orange-700'
        };
      case 'in_progress':
        return {
          icon: <MapPin className="w-12 h-12 text-blue-500" />,
          title: 'Đang cứu hộ',
          description: 'Đội cứu hộ đang trên đường đến',
          color: 'bg-blue-100 text-blue-700'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
          title: 'Hoàn thành',
          description: 'Cứu hộ đã hoàn tất',
          color: 'bg-green-100 text-green-700'
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-gray-500" />,
          title: 'Chờ xử lý',
          description: '',
          color: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          data-testid="back-home-btn"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Trang chủ
        </Button>

        <div className="glass-card rounded-3xl p-8 space-y-8">
          {/* Status */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {statusInfo.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{statusInfo.title}</h1>
              <p className="text-gray-600">{statusInfo.description}</p>
            </div>
            <div className={`inline-block px-6 py-2 rounded-full ${statusInfo.color} font-medium`}>
              {signal.status === 'pending' && 'Chờ tiếp nhận'}
              {signal.status === 'in_progress' && 'Đang tiến hành'}
              {signal.status === 'completed' && 'Đã hoàn thành'}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tiến trình</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Đã gửi tín hiệu SOS</p>
                  <p className="text-sm text-gray-500">
                    {new Date(signal.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  signal.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Đội cứu hộ tiếp nhận</p>
                  {signal.status !== 'pending' && (
                    <p className="text-sm text-gray-500">Đã tiếp nhận</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  signal.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Hoàn thành cứu hộ</p>
                  {signal.status === 'completed' && (
                    <p className="text-sm text-gray-500">Đã hoàn tất</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Vị trí của bạn
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Latitude: {signal.latitude}</p>
              <p>Longitude: {signal.longitude}</p>
            </div>
          </div>

          {/* AI Assessment */}
          {signal.ai_assessment && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Đánh giá từ AI</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{signal.ai_assessment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Map, Shield } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">SOS Vietnam</h1>
          </div>
          <div className="flex gap-3">
            <Button
              data-testid="view-map-btn"
              variant="outline"
              onClick={() => navigate('/map')}
              className="btn-transition"
            >
              <Map className="w-4 h-4 mr-2" />
              Xem bản đồ
            </Button>
            <Button
              data-testid="rescue-login-btn"
              onClick={() => navigate('/rescue/login')}
              className="btn-transition bg-blue-600 hover:bg-blue-700"
            >
              Đội cứu hộ
            </Button>
          </div>
        </header>

        {/* Main SOS Section */}
        <div className="max-w-2xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
              Khẩn cấp?
            </h2>
            <p className="text-lg text-gray-600">
              Bấm nút SOS để gửi tín hiệu cứu trợ ngay lập tức
            </p>
          </div>

          {/* SOS Button */}
          <div className="flex justify-center">
            <button
              data-testid="main-sos-btn"
              onClick={() => navigate('/sos')}
              className="relative group"
            >
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 sos-btn-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 sos-btn-pulse" style={{animationDelay: '0.5s'}}></div>
              
              {/* Main button */}
              <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 hover:shadow-red-500/50 active:scale-95">
                <AlertCircle className="w-24 h-24 mb-2" />
                <span className="text-3xl font-bold">SOS</span>
                <span className="text-sm opacity-90 mt-1">Gửi tín hiệu</span>
              </div>
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Vị trí tự động</h3>
              <p className="text-sm text-gray-600">Hệ thống tự động lấy vị trí GPS của bạn</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI đánh giá</h3>
              <p className="text-sm text-gray-600">AI phân tích mức độ nguy hiểm tự động</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚑</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cứu hộ nhanh</h3>
              <p className="text-sm text-gray-600">Đội cứu hộ sẽ tiếp cận ngay lập tức</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
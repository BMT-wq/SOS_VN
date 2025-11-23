import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Activity, MapPin, LogOut } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RescueDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('rescue_token');
    const teamData = localStorage.getItem('rescue_team');
    
    if (!token) {
      toast.error('Vui lòng đăng nhập');
      navigate('/rescue/login');
      return;
    }
    
    if (teamData) {
      setTeam(JSON.parse(teamData));
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('rescue_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, signalsRes] = await Promise.all([
        axios.get(`${API}/rescue/dashboard/stats`, { headers }),
        axios.get(`${API}/sos/signals?status=pending`, { headers })
      ]);

      setStats(statsRes.data);
      setSignals(signalsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn');
        handleLogout();
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rescue_token');
    localStorage.removeItem('rescue_team');
    navigate('/rescue/login');
  };

  const getDangerColor = (level) => {
    switch (level) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Cứu hộ</h1>
                <p className="text-sm text-gray-600">{team?.team_name || 'Team'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                data-testid="view-all-signals-btn"
                onClick={() => navigate('/rescue/signals')}
                variant="outline"
                className="btn-transition"
              >
                <Activity className="w-4 h-4 mr-2" />
                Tất cả tín hiệu
              </Button>
              <Button
                data-testid="logout-btn"
                onClick={handleLogout}
                variant="outline"
                className="btn-transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Tổng tín hiệu</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_signals || 0}</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Nguy hiểm cao</span>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-700">{stats?.red_signals || 0}</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Trung bình</span>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-700">{stats?.yellow_signals || 0}</p>
          </div>

          <div className="glass-card rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">An toàn</span>
              <AlertCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-700">{stats?.green_signals || 0}</p>
          </div>
        </div>

        {/* Recent Pending Signals */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tín hiệu chờ xử lý</h2>
          
          {signals.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không có tín hiệu chờ xử lý</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  data-testid={`pending-signal-${signal.id}`}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/rescue/signals/${signal.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-4 h-4 rounded-full mt-1 ${getDangerColor(signal.danger_level)}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Mức độ: {signal.danger_level === 'red' ? 'Cao' : signal.danger_level === 'yellow' ? 'Trung bình' : 'Thấp'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(signal.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{signal.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{signal.latitude.toFixed(4)}, {signal.longitude.toFixed(4)}</span>
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
  );
}
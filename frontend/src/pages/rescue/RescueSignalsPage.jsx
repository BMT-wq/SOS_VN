import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RescueSignalsPage() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDanger, setFilterDanger] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('rescue_token');
    if (!token) {
      toast.error('Vui lòng đăng nhập');
      navigate('/rescue/login');
      return;
    }
    fetchSignals();
  }, [filterStatus, filterDanger]);

  const fetchSignals = async () => {
    try {
      let url = `${API}/sos/signals`;
      const params = [];
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (filterDanger !== 'all') params.push(`danger_level=${filterDanger}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'in_progress': return 'Đang cứu hộ';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          data-testid="back-dashboard-btn"
          variant="ghost"
          onClick={() => navigate('/rescue/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Dashboard
        </Button>

        <div className="glass-card rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tất cả tín hiệu SOS</h1>
              <p className="text-gray-600">Quản lý và xử lý các tín hiệu cứu hộ</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]" data-testid="status-filter">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="in_progress">Đang cứu hộ</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDanger} onValueChange={setFilterDanger}>
                <SelectTrigger className="w-[150px]" data-testid="danger-filter">
                  <SelectValue placeholder="Mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="red">Cao</SelectItem>
                  <SelectItem value="yellow">Trung bình</SelectItem>
                  <SelectItem value="green">Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Signals Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có tín hiệu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mức độ</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mô tả</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vị trí</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời gian</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal) => (
                    <tr
                      key={signal.id}
                      data-testid={`signal-row-${signal.id}`}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getDangerColor(signal.danger_level)}`}></div>
                          <span className="text-sm font-medium">
                            {signal.danger_level === 'red' ? 'Cao' : signal.danger_level === 'yellow' ? 'TB' : 'Thấp'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900 line-clamp-2 max-w-xs">{signal.description}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{signal.latitude.toFixed(3)}, {signal.longitude.toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(signal.created_at).toLocaleString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {getStatusLabel(signal.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          data-testid={`view-signal-btn-${signal.id}`}
                          size="sm"
                          onClick={() => navigate(`/rescue/signals/${signal.id}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Camera, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SOSFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('Đã lấy vị trí của bạn');
        },
        (error) => {
          toast.error('Không thể lấy vị trí. Vui lòng cho phép truy cập.');
        }
      );
    }
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      toast.error('Tối đa 3 ảnh');
      return;
    }

    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        newImages.push(base64String);
        newPreviews.push(reader.result);
        
        if (newImages.length === files.length) {
          setImages([...images, ...newImages]);
          setPreviewUrls([...previewUrls, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Vui lòng cho phép truy cập vị trí');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Vui lòng mô tả tình huống');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/sos/create`, {
        latitude: location.latitude,
        longitude: location.longitude,
        description: description,
        images_base64: images,
        user_selected_level: 'medium'
      });

      toast.success('Đã gửi tín hiệu SOS!');
      navigate(`/track/${response.data.id}`);
    } catch (error) {
      console.error('Error sending SOS:', error);
      toast.error('Lỗi khi gửi tín hiệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          data-testid="back-btn"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Gửi tín hiệu SOS</h1>
            <p className="text-gray-600">Điền thông tin để đội cứu hộ có thể hỗ trợ bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Vị trí của bạn
              </Label>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                {location ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">Đã xác định vị trí</p>
                    <p className="text-gray-600">Lat: {location.latitude.toFixed(6)}</p>
                    <p className="text-gray-600">Long: {location.longitude.toFixed(6)}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Đang lấy vị trí...</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả tình huống *</Label>
              <Textarea
                id="description"
                data-testid="description-input"
                placeholder="Mô tả ngắn gọn tình huống khẩn cấp của bạn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Tải hình ảnh (tối đa 3)
              </Label>
              
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 3 && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    data-testid="image-upload-input"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Bấm để chọn ảnh</p>
                  </div>
                </label>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-testid="send-sos-btn"
              disabled={loading || !location}
              className="w-full bg-red-600 hover:bg-red-700 text-lg py-6 btn-transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Gửi tín hiệu SOS
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
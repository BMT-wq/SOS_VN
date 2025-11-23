#!/usr/bin/env python3
"""
Vietnamese SOS Emergency System - Backend API Testing
Tests all backend endpoints including rescue team auth, SOS signal management, and AI integration
"""

import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image
import uuid

class SOSBackendTester:
    def __init__(self, base_url="https://emergency-map-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.rescue_token = None
        self.test_team_id = None
        self.test_signal_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)
        
        if self.rescue_token and 'Authorization' not in default_headers:
            default_headers['Authorization'] = f'Bearer {self.rescue_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            return success, response.json() if success else f"Status {response.status_code}: {response.text}"

        except requests.exceptions.RequestException as e:
            return False, f"Request error: {str(e)}"
        except json.JSONDecodeError:
            return False, "Invalid JSON response"

    def create_test_image(self):
        """Create a test image with visual features (not blank)"""
        # Create a 200x200 image with some visual features
        img = Image.new('RGB', (200, 200), color='white')
        pixels = img.load()
        
        # Add some visual features - a simple pattern
        for i in range(200):
            for j in range(200):
                if (i + j) % 20 < 10:
                    pixels[i, j] = (255, 0, 0)  # Red squares
                elif i % 30 < 15:
                    pixels[i, j] = (0, 255, 0)  # Green stripes
                else:
                    pixels[i, j] = (0, 0, 255)  # Blue background
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return img_base64

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.make_request('GET', '')
        self.log_test("API Root", success and "SOS Emergency System API" in str(response))
        return success

    def test_rescue_team_register(self):
        """Test rescue team registration"""
        test_data = {
            "username": f"rescue_test_{datetime.now().strftime('%H%M%S')}",
            "password": "password123",
            "team_name": "Đội Test"
        }
        
        success, response = self.make_request('POST', 'rescue/register', test_data, expected_status=200)
        
        if success:
            self.test_team_id = response.get('id')
            # Store credentials for login test
            self.test_username = test_data['username']
            self.test_password = test_data['password']
        
        self.log_test("Rescue Team Registration", success, str(response) if not success else "")
        return success

    def test_rescue_team_login(self):
        """Test rescue team login"""
        if not hasattr(self, 'test_username'):
            self.log_test("Rescue Team Login", False, "No test user created")
            return False
            
        login_data = {
            "username": self.test_username,
            "password": self.test_password
        }
        
        success, response = self.make_request('POST', 'rescue/login', login_data, expected_status=200)
        
        if success and 'access_token' in response:
            self.rescue_token = response['access_token']
        
        self.log_test("Rescue Team Login", success and 'access_token' in str(response), str(response) if not success else "")
        return success

    def test_sos_signal_create(self):
        """Test SOS signal creation with AI analysis"""
        # Create test image with visual features
        test_image = self.create_test_image()
        
        signal_data = {
            "latitude": 21.0285,  # Hanoi coordinates
            "longitude": 105.8542,
            "description": "Khẩn cấp! Có tai nạn giao thông nghiêm trọng tại đây. Cần cứu hộ ngay lập tức. Có người bị thương nặng.",
            "images_base64": [test_image],
            "user_selected_level": "medium"
        }
        
        success, response = self.make_request('POST', 'sos/create', signal_data, expected_status=200)
        
        if success:
            self.test_signal_id = response.get('id')
            # Check if AI analysis worked
            has_ai_assessment = 'ai_assessment' in response and response['ai_assessment']
            has_danger_level = 'danger_level' in response and response['danger_level'] in ['red', 'yellow', 'green']
            
            if not has_ai_assessment:
                self.log_test("SOS Signal AI Analysis", False, "Missing AI assessment")
            elif not has_danger_level:
                self.log_test("SOS Signal AI Analysis", False, "Invalid danger level")
            else:
                self.log_test("SOS Signal AI Analysis", True)
        
        self.log_test("SOS Signal Creation", success, str(response) if not success else "")
        return success

    def test_get_sos_signals(self):
        """Test getting all SOS signals"""
        success, response = self.make_request('GET', 'sos/signals')
        
        is_list = isinstance(response, list) if success else False
        self.log_test("Get All SOS Signals", success and is_list, str(response) if not success else "")
        return success

    def test_get_sos_signal_by_id(self):
        """Test getting specific SOS signal"""
        if not self.test_signal_id:
            self.log_test("Get SOS Signal by ID", False, "No test signal created")
            return False
            
        success, response = self.make_request('GET', f'sos/signals/{self.test_signal_id}')
        
        has_required_fields = False
        if success:
            required_fields = ['id', 'latitude', 'longitude', 'description', 'danger_level', 'status']
            has_required_fields = all(field in response for field in required_fields)
        
        self.log_test("Get SOS Signal by ID", success and has_required_fields, str(response) if not success else "")
        return success

    def test_dashboard_stats(self):
        """Test rescue dashboard stats (requires auth)"""
        if not self.rescue_token:
            self.log_test("Dashboard Stats", False, "No rescue token available")
            return False
            
        success, response = self.make_request('GET', 'rescue/dashboard/stats')
        
        has_stats = False
        if success:
            required_stats = ['total_signals', 'red_signals', 'yellow_signals', 'green_signals', 'pending_signals']
            has_stats = all(stat in response for stat in required_stats)
        
        self.log_test("Dashboard Stats", success and has_stats, str(response) if not success else "")
        return success

    def test_update_sos_status(self):
        """Test updating SOS signal status (requires auth)"""
        if not self.rescue_token or not self.test_signal_id:
            self.log_test("Update SOS Status", False, "Missing token or signal ID")
            return False
            
        update_data = {
            "status": "in_progress",
            "notes": "Đội cứu hộ đang trên đường đến hiện trường"
        }
        
        success, response = self.make_request('PUT', f'sos/signals/{self.test_signal_id}/status', update_data)
        self.log_test("Update SOS Status", success, str(response) if not success else "")
        return success

    def test_rescue_location_tracking(self):
        """Test rescue location tracking (requires auth)"""
        if not self.rescue_token or not self.test_signal_id:
            self.log_test("Rescue Location Tracking", False, "Missing token or signal ID")
            return False
            
        location_data = {
            "signal_id": self.test_signal_id,
            "latitude": 21.0285,
            "longitude": 105.8542
        }
        
        success, response = self.make_request('POST', 'rescue/location', location_data)
        self.log_test("Rescue Location Tracking", success, str(response) if not success else "")
        return success

    def test_get_rescue_locations(self):
        """Test getting rescue locations for a signal"""
        if not self.test_signal_id:
            self.log_test("Get Rescue Locations", False, "No test signal ID")
            return False
            
        success, response = self.make_request('GET', f'rescue/location/{self.test_signal_id}')
        
        is_list = isinstance(response, list) if success else False
        self.log_test("Get Rescue Locations", success and is_list, str(response) if not success else "")
        return success

    def test_filtered_signals(self):
        """Test filtered signal queries"""
        # Test status filter
        success1, _ = self.make_request('GET', 'sos/signals?status=pending')
        self.log_test("Filter Signals by Status", success1)
        
        # Test danger level filter
        success2, _ = self.make_request('GET', 'sos/signals?danger_level=red')
        self.log_test("Filter Signals by Danger Level", success2)
        
        return success1 and success2

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Vietnamese SOS Emergency System Backend Tests")
        print(f"🔗 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Basic API tests
        self.test_api_root()
        
        # Rescue team authentication flow
        self.test_rescue_team_register()
        self.test_rescue_team_login()
        
        # SOS signal management
        self.test_sos_signal_create()
        self.test_get_sos_signals()
        self.test_get_sos_signal_by_id()
        self.test_filtered_signals()
        
        # Authenticated rescue team operations
        self.test_dashboard_stats()
        self.test_update_sos_status()
        self.test_rescue_location_tracking()
        self.test_get_rescue_locations()
        
        # Print results
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SOSBackendTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
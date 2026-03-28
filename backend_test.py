#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Spissky Hrad Audio Guide
Tests all critical endpoints as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, Any, Optional
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://spis-free-tour.preview.emergentagent.com/api"

class SpisskyHradAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.created_partner_id = None
        
    def log_test(self, test_name: str, success: bool, details: str):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status}: {test_name} - {details}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self) -> bool:
        """Test GET /api/health - Should return status healthy"""
        try:
            url = f"{self.base_url}/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, f"Status: {data.get('status')}, Database: {data.get('database')}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected status: {data.get('status')}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_get_tour_stops(self) -> bool:
        """Test GET /api/tour-stops - Should return a list of tour stops"""
        try:
            url = f"{self.base_url}/tour-stops"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Tour Stops", True, f"Retrieved {len(data)} tour stops")
                    return True
                else:
                    self.log_test("Get Tour Stops", False, "Response is not a list")
                    return False
            else:
                self.log_test("Get Tour Stops", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Tour Stops", False, f"Exception: {str(e)}")
            return False
    
    def test_get_partners(self) -> bool:
        """Test GET /api/partners - Should return list of partners"""
        try:
            url = f"{self.base_url}/partners"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Partners", True, f"Retrieved {len(data)} partners")
                    return True
                else:
                    self.log_test("Get Partners", False, "Response is not a list")
                    return False
            else:
                self.log_test("Get Partners", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Partners", False, f"Exception: {str(e)}")
            return False
    
    def test_create_partner(self) -> Optional[str]:
        """Test POST /api/admin/partners - Create a test partner"""
        try:
            url = f"{self.base_url}/admin/partners"
            partner_data = {
                "name": "Test Restaurant",
                "category": "restaurant",
                "description": "Test desc",
                "phone": "+421111222"
            }
            
            response = requests.post(url, json=partner_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                partner_id = data.get("id")
                if partner_id:
                    self.created_partner_id = partner_id
                    self.log_test("Create Partner", True, f"Created partner with ID: {partner_id}")
                    return partner_id
                else:
                    self.log_test("Create Partner", False, "No ID returned in response")
                    return None
            else:
                self.log_test("Create Partner", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Create Partner", False, f"Exception: {str(e)}")
            return None
    
    def test_verify_partner_created(self, partner_id: str) -> bool:
        """Test GET /api/partners - Verify new partner appears"""
        try:
            url = f"{self.base_url}/partners"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                partners = response.json()
                for partner in partners:
                    if partner.get("id") == partner_id and partner.get("name") == "Test Restaurant":
                        self.log_test("Verify Partner Created", True, f"Found created partner: {partner.get('name')}")
                        return True
                
                self.log_test("Verify Partner Created", False, "Created partner not found in partners list")
                return False
            else:
                self.log_test("Verify Partner Created", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Verify Partner Created", False, f"Exception: {str(e)}")
            return False
    
    def test_update_partner(self, partner_id: str) -> bool:
        """Test PUT /api/admin/partners/{id} - Update the test partner name"""
        try:
            url = f"{self.base_url}/admin/partners/{partner_id}"
            update_data = {
                "name": "Updated Restaurant"
            }
            
            response = requests.put(url, json=update_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == "Updated Restaurant":
                    self.log_test("Update Partner", True, f"Updated partner name to: {data.get('name')}")
                    return True
                else:
                    self.log_test("Update Partner", False, f"Name not updated correctly: {data.get('name')}")
                    return False
            else:
                self.log_test("Update Partner", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Partner", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_partner(self, partner_id: str) -> bool:
        """Test DELETE /api/admin/partners/{id} - Delete the test partner"""
        try:
            url = f"{self.base_url}/admin/partners/{partner_id}"
            response = requests.delete(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Partner", True, f"Partner deleted: {data.get('message')}")
                    return True
                else:
                    self.log_test("Delete Partner", False, "No message in response")
                    return False
            else:
                self.log_test("Delete Partner", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Partner", False, f"Exception: {str(e)}")
            return False
    
    def test_admin_stats(self) -> bool:
        """Test GET /api/admin/stats - Should return statistics"""
        try:
            url = f"{self.base_url}/admin/stats"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_stops", "total_partners", "total_referrals"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Admin Stats", True, f"Stats: {data.get('total_stops')} stops, {data.get('total_partners')} partners")
                    return True
                else:
                    self.log_test("Admin Stats", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Admin Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Stats", False, f"Exception: {str(e)}")
            return False
    
    def test_deeplink_config(self) -> bool:
        """Test GET /api/deeplink/config - Should return deep link configuration"""
        try:
            url = f"{self.base_url}/deeplink/config"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["gastroflow_base_url", "audioguide_base_url", "is_enabled"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Deeplink Config", True, f"Config loaded, enabled: {data.get('is_enabled')}")
                    return True
                else:
                    self.log_test("Deeplink Config", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Deeplink Config", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Deeplink Config", False, f"Exception: {str(e)}")
            return False
    
    def test_track_referral(self) -> bool:
        """Test POST /api/deeplink/referral - Track a referral"""
        try:
            url = f"{self.base_url}/deeplink/referral"
            referral_data = {
                "source_app": "audioguide",
                "target_app": "gastroflow",
                "referral_type": "direct"
            }
            
            response = requests.post(url, json=referral_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "id" in data:
                    self.log_test("Track Referral", True, f"Referral tracked: {data.get('message')}")
                    return True
                else:
                    self.log_test("Track Referral", False, "Missing message or id in response")
                    return False
            else:
                self.log_test("Track Referral", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Track Referral", False, f"Exception: {str(e)}")
            return False
    
    def test_referral_stats(self) -> bool:
        """Test GET /api/deeplink/referrals/stats - Should show referral count"""
        try:
            url = f"{self.base_url}/deeplink/referrals/stats"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_referrals", "from_gastroflow", "from_audioguide"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Referral Stats", True, f"Total referrals: {data.get('total_referrals')}")
                    return True
                else:
                    self.log_test("Referral Stats", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Referral Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Referral Stats", False, f"Exception: {str(e)}")
            return False
    
    def test_nearby_restaurants(self) -> bool:
        """Test GET /api/deeplink/nearby-restaurants - Should return restaurant partners"""
        try:
            url = f"{self.base_url}/deeplink/nearby-restaurants"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    restaurant_count = len([r for r in data if r.get("category") == "restaurant"])
                    self.log_test("Nearby Restaurants", True, f"Retrieved {restaurant_count} restaurants")
                    return True
                else:
                    self.log_test("Nearby Restaurants", False, "Response is not a list")
                    return False
            else:
                self.log_test("Nearby Restaurants", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Nearby Restaurants", False, f"Exception: {str(e)}")
            return False
    
    def test_get_travel_info(self) -> bool:
        """Test GET /api/content/travel-info - Should return travel info"""
        try:
            url = f"{self.base_url}/content/travel-info"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["location_name", "opening_hours_summer"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Travel Info", True, f"Location: {data.get('location_name')}")
                    return True
                else:
                    self.log_test("Get Travel Info", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Get Travel Info", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Travel Info", False, f"Exception: {str(e)}")
            return False
    
    def test_update_travel_info(self) -> bool:
        """Test PUT /api/content/travel-info - Update travel info"""
        try:
            url = f"{self.base_url}/content/travel-info"
            update_data = {
                "location_name": "Spisske Podhradie",
                "opening_hours_summer": "9:00 - 19:00"
            }
            
            response = requests.put(url, json=update_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Update Travel Info", True, f"Travel info updated: {data.get('message')}")
                    return True
                else:
                    self.log_test("Update Travel Info", False, "No message in response")
                    return False
            else:
                self.log_test("Update Travel Info", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Travel Info", False, f"Exception: {str(e)}")
            return False
    
    def test_get_shop_content(self) -> bool:
        """Test GET /api/content/shop - Should return shop content"""
        try:
            url = f"{self.base_url}/content/shop"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["ticket_adult", "contact_email"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Shop Content", True, f"Adult ticket: {data.get('ticket_adult')}")
                    return True
                else:
                    self.log_test("Get Shop Content", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Get Shop Content", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Shop Content", False, f"Exception: {str(e)}")
            return False
    
    def test_get_user_progress(self) -> bool:
        """Test GET /api/progress/default-user - Should return user progress"""
        try:
            url = f"{self.base_url}/progress/default-user"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["user_id", "completed_stops"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get User Progress", True, f"User: {data.get('user_id')}, completed: {len(data.get('completed_stops', []))}")
                    return True
                else:
                    self.log_test("Get User Progress", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Get User Progress", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get User Progress", False, f"Exception: {str(e)}")
            return False
    
    def get_first_tour_stop_id(self) -> Optional[str]:
        """Get the first tour stop ID for QR code testing"""
        try:
            url = f"{self.base_url}/tour-stops"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("id")
            return None
        except Exception:
            return None
    
    def test_get_tour_stop_detail(self, stop_id: str) -> bool:
        """Test GET /api/tour-stops/{id} - Should return tour stop details"""
        try:
            url = f"{self.base_url}/tour-stops/{stop_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "stop_number", "content"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Tour Stop Detail", True, f"Stop #{data.get('stop_number')}: {data.get('id')}")
                    return True
                else:
                    self.log_test("Get Tour Stop Detail", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Get Tour Stop Detail", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Tour Stop Detail", False, f"Exception: {str(e)}")
            return False
    
    def test_qr_all_codes(self) -> bool:
        """Test GET /api/qr/all?size=300 - Should return all QR codes as base64"""
        try:
            url = f"{self.base_url}/qr/all?size=300"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "qr_codes" in data and isinstance(data["qr_codes"], list):
                    qr_count = len(data["qr_codes"])
                    # Check if each QR code has qr_base64 field
                    valid_qrs = all("qr_base64" in qr for qr in data["qr_codes"])
                    if valid_qrs:
                        self.log_test("QR All Codes", True, f"Retrieved {qr_count} QR codes with base64 data")
                        return True
                    else:
                        self.log_test("QR All Codes", False, "Some QR codes missing qr_base64 field")
                        return False
                else:
                    self.log_test("QR All Codes", False, "Missing qr_codes array in response")
                    return False
            else:
                self.log_test("QR All Codes", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("QR All Codes", False, f"Exception: {str(e)}")
            return False
    
    def test_qr_single_base64(self, stop_id: str) -> bool:
        """Test GET /api/qr/stop/{id}?format=base64 - Should return single QR as base64"""
        try:
            url = f"{self.base_url}/qr/stop/{stop_id}?format=base64"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "qr_base64" in data and data["qr_base64"]:
                    self.log_test("QR Single Base64", True, f"Retrieved QR code for stop {stop_id}")
                    return True
                else:
                    self.log_test("QR Single Base64", False, "Missing or empty qr_base64 field")
                    return False
            else:
                self.log_test("QR Single Base64", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("QR Single Base64", False, f"Exception: {str(e)}")
            return False
    
    def test_qr_single_png(self, stop_id: str) -> bool:
        """Test GET /api/qr/stop/{id}?format=png&size=400 - Should return PNG image"""
        try:
            url = f"{self.base_url}/qr/stop/{stop_id}?format=png&size=400"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image/png' in content_type:
                    self.log_test("QR Single PNG", True, f"Retrieved PNG QR code for stop {stop_id}")
                    return True
                else:
                    self.log_test("QR Single PNG", False, f"Wrong content-type: {content_type}")
                    return False
            else:
                self.log_test("QR Single PNG", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("QR Single PNG", False, f"Exception: {str(e)}")
            return False
    
    def test_qr_print_sheet(self) -> bool:
        """Test GET /api/qr/print-sheet - Should return A4 print sheet as PNG"""
        try:
            url = f"{self.base_url}/qr/print-sheet"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image/png' in content_type:
                    self.log_test("QR Print Sheet", True, "Retrieved A4 print sheet with all QR codes")
                    return True
                else:
                    self.log_test("QR Print Sheet", False, f"Wrong content-type: {content_type}")
                    return False
            else:
                self.log_test("QR Print Sheet", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("QR Print Sheet", False, f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all comprehensive API tests"""
        print("=" * 80)
        print("SPISSKY HRAD AUDIO GUIDE - COMPREHENSIVE BACKEND API TESTS")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print()
        
        # Test 1: Health Check
        print("🏥 Test 1: Health Check")
        self.test_health_check()
        
        # Test 2: Tour Stops
        print("\n🏰 Test 2: Tour Stops")
        self.test_get_tour_stops()
        
        # Get first tour stop ID for detailed tests
        first_stop_id = self.get_first_tour_stop_id()
        if first_stop_id:
            print(f"\n🎯 Test 3: Tour Stop Detail (ID: {first_stop_id[:8]}...)")
            self.test_get_tour_stop_detail(first_stop_id)
        
        # Test 4: Partners (initial)
        print("\n🤝 Test 4: Get Partners (initial)")
        self.test_get_partners()
        
        # Test 5: Create Partner
        print("\n➕ Test 5: Create Test Partner")
        partner_id = self.test_create_partner()
        
        # Test 6: Verify Partner Created
        if partner_id:
            print("\n✅ Test 6: Verify Partner Created")
            self.test_verify_partner_created(partner_id)
            
            # Test 7: Update Partner
            print("\n📝 Test 7: Update Partner")
            self.test_update_partner(partner_id)
            
            # Test 8: Delete Partner
            print("\n🗑️ Test 8: Delete Partner")
            self.test_delete_partner(partner_id)
        
        # QR Code Tests (NEW)
        if first_stop_id:
            print("\n📱 Test 9: QR All Codes")
            self.test_qr_all_codes()
            
            print(f"\n📱 Test 10: QR Single Base64 (Stop: {first_stop_id[:8]}...)")
            self.test_qr_single_base64(first_stop_id)
            
            print(f"\n📱 Test 11: QR Single PNG (Stop: {first_stop_id[:8]}...)")
            self.test_qr_single_png(first_stop_id)
            
            print("\n📱 Test 12: QR Print Sheet")
            self.test_qr_print_sheet()
        
        # Test 13: Deep Link Config
        print("\n🔗 Test 13: Deep Link Configuration")
        self.test_deeplink_config()
        
        # Test 14: Track Referral
        print("\n📈 Test 14: Track Referral")
        self.test_track_referral()
        
        # Test 15: Referral Stats
        print("\n📊 Test 15: Referral Statistics")
        self.test_referral_stats()
        
        # Test 16: Nearby Restaurants
        print("\n🍽️ Test 16: Nearby Restaurants")
        self.test_nearby_restaurants()
        
        # Test 17: Travel Info
        print("\n🚗 Test 17: Get Travel Info")
        self.test_get_travel_info()
        
        # Test 18: Update Travel Info
        print("\n📝 Test 18: Update Travel Info")
        self.test_update_travel_info()
        
        # Test 19: Shop Content
        print("\n🛒 Test 19: Shop Content")
        self.test_get_shop_content()
        
        # Test 20: Admin Stats
        print("\n📊 Test 20: Admin Statistics")
        self.test_admin_stats()
        
        # Test 21: User Progress
        print("\n👤 Test 21: User Progress")
        self.test_get_user_progress()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        return failed_tests == 0

def main():
    """Main test execution"""
    tester = SpisskyHradAPITester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 All backend API tests PASSED!")
        sys.exit(0)
    else:
        print("\n💥 Some tests FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
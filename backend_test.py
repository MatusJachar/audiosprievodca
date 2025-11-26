#!/usr/bin/env python3
"""
Backend API Testing for Castle Audio Tour Guide
Testing the new Legends tour stop implementation and Russian content updates
"""

import requests
import json
import sys
from typing import Dict, List, Any

# Backend URL from frontend .env
BACKEND_URL = "https://spistour.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.legends_stop_id = None
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        self.test_results.append(result)
        print(result)
        
    def test_get_all_tour_stops(self):
        """Test GET /api/tour-stops - Should return 14 stops (13 numbered + 1 Legends)"""
        print("\n=== Testing GET /api/tour-stops ===")
        
        try:
            response = requests.get(f"{self.backend_url}/tour-stops", timeout=30)
            
            if response.status_code != 200:
                self.log_test("GET /api/tour-stops status", False, f"Status: {response.status_code}")
                return False
                
            stops = response.json()
            
            # Test 1: Total count should be 14
            total_count = len(stops)
            self.log_test("Total stop count", total_count == 14, f"Expected: 14, Got: {total_count}")
            
            # Test 2: Find numbered stops (1-13) and Legends stop
            numbered_stops = [s for s in stops if s.get('stop_number') is not None]
            legends_stops = [s for s in stops if s.get('stop_name') == 'Legends']
            
            self.log_test("Numbered stops count", len(numbered_stops) == 13, f"Expected: 13, Got: {len(numbered_stops)}")
            self.log_test("Legends stops count", len(legends_stops) == 1, f"Expected: 1, Got: {len(legends_stops)}")
            
            # Test 3: Verify Legends stop structure
            if legends_stops:
                legends_stop = legends_stops[0]
                self.legends_stop_id = legends_stop.get('id')
                
                # Check stop_name
                self.log_test("Legends stop_name", legends_stop.get('stop_name') == 'Legends', 
                            f"Expected: 'Legends', Got: {legends_stop.get('stop_name')}")
                
                # Check stop_number is null
                self.log_test("Legends stop_number is null", legends_stop.get('stop_number') is None,
                            f"Expected: null, Got: {legends_stop.get('stop_number')}")
                
                # Check legends array exists and has 4 items
                legends_array = legends_stop.get('legends', [])
                self.log_test("Legends array count", len(legends_array) == 4, 
                            f"Expected: 4, Got: {len(legends_array)}")
                
                # Test each legend has content in 6 languages
                expected_languages = ['en', 'de', 'pl', 'hu', 'sk', 'ru']
                for i, legend in enumerate(legends_array):
                    legend_content = legend.get('content', {})
                    available_languages = list(legend_content.keys())
                    
                    self.log_test(f"Legend {i+1} language count", len(available_languages) == 6,
                                f"Expected: 6 languages, Got: {len(available_languages)}")
                    
                    # Check each language has title and description
                    for lang in expected_languages:
                        if lang in legend_content:
                            content = legend_content[lang]
                            has_title = 'title' in content and content['title']
                            has_description = 'description' in content and content['description']
                            self.log_test(f"Legend {i+1} {lang} content", has_title and has_description,
                                        f"Title: {has_title}, Description: {has_description}")
                
                # Verify legend names
                expected_legend_titles = [
                    "Legend of the Tatar Princess Šad",
                    "Legend of Knight Šaršek", 
                    "Legend of Beautiful Hedwig",
                    "Legend of the White Lady"
                ]
                
                for i, legend in enumerate(legends_array):
                    if i < len(expected_legend_titles):
                        en_title = legend.get('content', {}).get('en', {}).get('title', '')
                        expected_title = expected_legend_titles[i]
                        self.log_test(f"Legend {i+1} English title", expected_title in en_title,
                                    f"Expected: '{expected_title}', Got: '{en_title}'")
            
            # Test 4: Verify Russian content for stops 1-2
            stop_1 = next((s for s in stops if s.get('stop_number') == 1), None)
            stop_2 = next((s for s in stops if s.get('stop_number') == 2), None)
            
            if stop_1:
                ru_content_1 = stop_1.get('content', {}).get('ru', {})
                ru_desc_1 = ru_content_1.get('description', '')
                self.log_test("Stop 1 Russian content length", len(ru_desc_1) >= 700,
                            f"Expected: ~756 chars, Got: {len(ru_desc_1)} chars")
                
            if stop_2:
                ru_content_2 = stop_2.get('content', {}).get('ru', {})
                ru_desc_2 = ru_content_2.get('description', '')
                self.log_test("Stop 2 Russian content length", len(ru_desc_2) >= 2400,
                            f"Expected: ~2507 chars, Got: {len(ru_desc_2)} chars")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET /api/tour-stops request", False, f"Request error: {str(e)}")
            return False
        except Exception as e:
            self.log_test("GET /api/tour-stops processing", False, f"Processing error: {str(e)}")
            return False
    
    def test_get_legends_stop_by_id(self):
        """Test GET /api/tour-stops/{legends_id} - Fetch Legends stop by ID"""
        print("\n=== Testing GET /api/tour-stops/{legends_id} ===")
        
        if not self.legends_stop_id:
            self.log_test("Legends stop ID available", False, "No Legends stop ID found from previous test")
            return False
            
        try:
            response = requests.get(f"{self.backend_url}/tour-stops/{self.legends_stop_id}", timeout=30)
            
            if response.status_code != 200:
                self.log_test("GET Legends stop by ID status", False, f"Status: {response.status_code}")
                return False
                
            legends_stop = response.json()
            
            # Verify it's the Legends stop
            self.log_test("Retrieved stop is Legends", legends_stop.get('stop_name') == 'Legends',
                        f"Expected: 'Legends', Got: {legends_stop.get('stop_name')}")
            
            # Verify structure
            self.log_test("Legends stop has ID", 'id' in legends_stop and legends_stop['id'],
                        f"ID present: {'id' in legends_stop}")
            
            legends_array = legends_stop.get('legends', [])
            self.log_test("Legends array accessible by ID", len(legends_array) == 4,
                        f"Expected: 4 legends, Got: {len(legends_array)}")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET Legends stop by ID request", False, f"Request error: {str(e)}")
            return False
        except Exception as e:
            self.log_test("GET Legends stop by ID processing", False, f"Processing error: {str(e)}")
            return False
    
    def test_backend_health(self):
        """Test basic backend connectivity"""
        print("\n=== Testing Backend Health ===")
        
        try:
            response = requests.get(f"{self.backend_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend health check", True, f"Message: {data.get('message', 'No message')}")
                return True
            else:
                self.log_test("Backend health check", False, f"Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Backend connectivity", False, f"Connection error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests for Legends implementation"""
        print(f"🧪 Starting Backend Tests for Legends Tour Stop Implementation")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 80)
        
        # Test backend health first
        if not self.test_backend_health():
            print("\n❌ Backend is not accessible. Stopping tests.")
            return False
        
        # Run main tests
        success_count = 0
        total_tests = 2
        
        if self.test_get_all_tour_stops():
            success_count += 1
            
        if self.test_get_legends_stop_by_id():
            success_count += 1
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 TEST SUMMARY")
        print("=" * 80)
        
        for result in self.test_results:
            print(result)
        
        print(f"\nOverall: {success_count}/{total_tests} major test categories passed")
        
        if success_count == total_tests:
            print("🎉 All Legends tour stop tests PASSED!")
            return True
        else:
            print("⚠️  Some tests FAILED - see details above")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Backend testing completed with failures")
        sys.exit(1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Backend API Testing for Castle Audio Tour Guide
Focus: User Progress Tracking Endpoints
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://castleaudio.preview.emergentagent.com/api"

class ProgressTrackingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.user_id = "default-user"
        self.test_results = []
        
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
        
    def test_get_initial_progress(self) -> Dict[str, Any]:
        """Test GET /api/progress/default-user - should return user progress with completed_stops array"""
        try:
            url = f"{self.base_url}/progress/{self.user_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["user_id", "completed_stops"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("GET Initial Progress", False, f"Missing fields: {missing_fields}")
                    return {}
                
                if not isinstance(data["completed_stops"], list):
                    self.log_test("GET Initial Progress", False, "completed_stops is not an array")
                    return {}
                
                self.log_test("GET Initial Progress", True, 
                             f"Retrieved progress for user_id: {data['user_id']}, completed_stops: {len(data['completed_stops'])} items")
                return data
            else:
                self.log_test("GET Initial Progress", False, 
                             f"HTTP {response.status_code}: {response.text}")
                return {}
                
        except Exception as e:
            self.log_test("GET Initial Progress", False, f"Exception: {str(e)}")
            return {}
    
    def test_mark_stop_complete(self, stop_id: str) -> bool:
        """Test POST /api/progress/default-user/complete/{stop_id}"""
        try:
            url = f"{self.base_url}/progress/{self.user_id}/complete/{stop_id}"
            response = requests.post(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test(f"Mark Stop {stop_id} Complete", True, 
                                 f"Successfully marked stop complete: {data['message']}")
                    return True
                else:
                    self.log_test(f"Mark Stop {stop_id} Complete", False, 
                                 "Response missing 'message' field")
                    return False
            else:
                self.log_test(f"Mark Stop {stop_id} Complete", False, 
                             f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"Mark Stop {stop_id} Complete", False, f"Exception: {str(e)}")
            return False
    
    def test_reset_progress(self) -> bool:
        """Test POST /api/progress/default-user/reset"""
        try:
            url = f"{self.base_url}/progress/{self.user_id}/reset"
            response = requests.post(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Reset Progress", True, 
                                 f"Successfully reset progress: {data['message']}")
                    return True
                else:
                    self.log_test("Reset Progress", False, 
                                 "Response missing 'message' field")
                    return False
            else:
                self.log_test("Reset Progress", False, 
                             f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Reset Progress", False, f"Exception: {str(e)}")
            return False
    
    def verify_progress_persistence(self, expected_stops: list) -> bool:
        """Verify that progress changes persist correctly"""
        try:
            progress = self.test_get_initial_progress()
            if not progress:
                return False
                
            actual_stops = progress.get("completed_stops", [])
            
            if set(actual_stops) == set(expected_stops):
                self.log_test("Progress Persistence", True, 
                             f"Expected stops {expected_stops} match actual {actual_stops}")
                return True
            else:
                self.log_test("Progress Persistence", False, 
                             f"Expected {expected_stops} but got {actual_stops}")
                return False
                
        except Exception as e:
            self.log_test("Progress Persistence", False, f"Exception: {str(e)}")
            return False
    
    def get_sample_stop_ids(self) -> list:
        """Get some sample stop IDs from the tour stops endpoint"""
        try:
            url = f"{self.base_url}/tour-stops"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                stops = response.json()
                if len(stops) >= 2:
                    # Get first two stop IDs for testing
                    stop_ids = [stops[0]["id"], stops[1]["id"]]
                    print(f"Using sample stop IDs for testing: {stop_ids}")
                    return stop_ids
                else:
                    print("Warning: Less than 2 tour stops available")
                    return []
            else:
                print(f"Failed to fetch tour stops: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching sample stop IDs: {str(e)}")
            return []
    
    def run_comprehensive_test(self):
        """Run comprehensive progress tracking tests"""
        print("=" * 60)
        print("BACKEND PROGRESS TRACKING API TESTS")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print(f"User ID: {self.user_id}")
        print()
        
        # Get sample stop IDs
        sample_stops = self.get_sample_stop_ids()
        if len(sample_stops) < 2:
            print("❌ Cannot run tests: Need at least 2 tour stops")
            return False
        
        stop1_id, stop2_id = sample_stops[0], sample_stops[1]
        
        # Test Scenario 1: Reset progress first to ensure clean state
        print("🧹 Resetting progress to clean state...")
        self.test_reset_progress()
        
        # Test Scenario 2: Fetch initial progress (should have empty completed_stops)
        print("\n📋 Test Scenario 1: Fetch initial progress")
        initial_progress = self.test_get_initial_progress()
        if initial_progress:
            self.verify_progress_persistence([])
        
        # Test Scenario 3: Mark stop 1 as complete
        print(f"\n✅ Test Scenario 2: Mark stop {stop1_id} as complete")
        if self.test_mark_stop_complete(stop1_id):
            self.verify_progress_persistence([stop1_id])
        
        # Test Scenario 4: Mark stop 2 as complete
        print(f"\n✅ Test Scenario 3: Mark stop {stop2_id} as complete")
        if self.test_mark_stop_complete(stop2_id):
            self.verify_progress_persistence([stop1_id, stop2_id])
        
        # Test Scenario 5: Reset progress
        print("\n🔄 Test Scenario 4: Reset progress")
        if self.test_reset_progress():
            self.verify_progress_persistence([])
        
        # Test Scenario 6: Verify duplicate completion handling
        print(f"\n🔁 Test Scenario 5: Test duplicate completion (mark {stop1_id} twice)")
        self.test_mark_stop_complete(stop1_id)
        self.test_mark_stop_complete(stop1_id)  # Should not duplicate
        self.verify_progress_persistence([stop1_id])
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
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
        
        return failed_tests == 0

def main():
    """Main test execution"""
    tester = ProgressTrackingTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 All progress tracking tests PASSED!")
        sys.exit(0)
    else:
        print("\n💥 Some tests FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
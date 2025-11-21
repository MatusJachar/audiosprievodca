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
BACKEND_URL = "https://castle-legends-1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.results = {
            "total_stops": 0,
            "stops_with_audio": 0,
            "audio_validation": {},
            "missing_audio": [],
            "invalid_audio": [],
            "detailed_results": []
        }
    
    def validate_base64(self, data: str) -> bool:
        """Validate if string is proper base64"""
        try:
            if not data:
                return False
            # Check if it's valid base64
            base64.b64decode(data)
            return True
        except Exception:
            return False
    
    def test_tour_stops_audio_data(self):
        """Test all tour stops for audio data availability"""
        print("🎵 Testing Tour Stops Audio Data Availability")
        print("=" * 60)
        
        try:
            # Get all tour stops
            response = requests.get(f"{BACKEND_URL}/tour-stops", timeout=30)
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch tour stops: {response.status_code}")
                return False
            
            stops = response.json()
            self.results["total_stops"] = len(stops)
            
            print(f"📍 Found {len(stops)} tour stops")
            print()
            
            # Test each stop for audio data
            for stop in stops:
                stop_result = self.test_single_stop_audio(stop)
                self.results["detailed_results"].append(stop_result)
                
                if stop_result["has_audio"]:
                    self.results["stops_with_audio"] += 1
            
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def test_single_stop_audio(self, stop: Dict[str, Any]) -> Dict[str, Any]:
        """Test audio data for a single tour stop"""
        stop_id = stop.get("id", "unknown")
        stop_number = stop.get("stop_number", "unknown")
        
        result = {
            "stop_id": stop_id,
            "stop_number": stop_number,
            "has_audio": False,
            "languages_tested": ["en", "pl"],
            "audio_status": {},
            "required_fields": {},
            "issues": []
        }
        
        print(f"🔍 Testing Stop {stop_number} (ID: {stop_id[:8]}...)")
        
        # Check required fields
        required_fields = ["id", "stop_number", "content", "audio", "created_at", "updated_at"]
        for field in required_fields:
            result["required_fields"][field] = field in stop
            if field not in stop:
                result["issues"].append(f"Missing required field: {field}")
        
        # Check audio data for English and Polish
        audio_data = stop.get("audio", {})
        
        for lang in ["en", "pl"]:
            audio_base64 = audio_data.get(lang, "")
            
            status = {
                "present": bool(audio_base64),
                "length": len(audio_base64) if audio_base64 else 0,
                "valid_base64": False,
                "sufficient_length": False
            }
            
            if audio_base64:
                # Validate base64 format
                status["valid_base64"] = self.validate_base64(audio_base64)
                
                # Check if length is reasonable (>100k characters as requested)
                status["sufficient_length"] = len(audio_base64) > 100000
                
                if status["valid_base64"] and status["sufficient_length"]:
                    print(f"  ✅ {lang.upper()}: Valid audio ({len(audio_base64):,} chars)")
                elif status["valid_base64"]:
                    print(f"  ⚠️  {lang.upper()}: Valid format but short ({len(audio_base64):,} chars)")
                    result["issues"].append(f"{lang} audio too short: {len(audio_base64)} chars")
                else:
                    print(f"  ❌ {lang.upper()}: Invalid base64 format")
                    result["issues"].append(f"{lang} audio invalid base64")
            else:
                print(f"  ❌ {lang.upper()}: No audio data")
                result["issues"].append(f"Missing {lang} audio")
            
            result["audio_status"][lang] = status
        
        # Determine if stop has valid audio
        en_valid = (result["audio_status"]["en"]["valid_base64"] and 
                   result["audio_status"]["en"]["sufficient_length"])
        pl_valid = (result["audio_status"]["pl"]["valid_base64"] and 
                   result["audio_status"]["pl"]["sufficient_length"])
        
        result["has_audio"] = en_valid and pl_valid
        
        if not result["has_audio"]:
            self.results["missing_audio"].append({
                "stop_number": stop_number,
                "stop_id": stop_id,
                "issues": result["issues"]
            })
        
        print()
        return result
    
    def test_specific_stop_detail(self, stop_id: str):
        """Test fetching specific stop to verify data consistency"""
        print(f"🔍 Testing specific stop detail: {stop_id[:8]}...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/tour-stops/{stop_id}", timeout=30)
            
            if response.status_code == 200:
                stop = response.json()
                print(f"  ✅ Successfully fetched stop {stop.get('stop_number', 'unknown')}")
                return stop
            else:
                print(f"  ❌ Failed to fetch stop: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  ❌ Error fetching stop: {e}")
            return None
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 60)
        print("📊 AUDIO DATA VALIDATION SUMMARY")
        print("=" * 60)
        
        print(f"Total tour stops found: {self.results['total_stops']}")
        print(f"Stops with complete audio: {self.results['stops_with_audio']}")
        print(f"Success rate: {(self.results['stops_with_audio']/self.results['total_stops']*100):.1f}%")
        
        if self.results["missing_audio"]:
            print(f"\n❌ STOPS WITH AUDIO ISSUES ({len(self.results['missing_audio'])}):")
            for issue in self.results["missing_audio"]:
                print(f"  Stop {issue['stop_number']}: {', '.join(issue['issues'])}")
        
        print(f"\n📈 DETAILED AUDIO STATISTICS:")
        en_count = sum(1 for r in self.results["detailed_results"] 
                      if r["audio_status"]["en"]["valid_base64"] and r["audio_status"]["en"]["sufficient_length"])
        pl_count = sum(1 for r in self.results["detailed_results"] 
                      if r["audio_status"]["pl"]["valid_base64"] and r["audio_status"]["pl"]["sufficient_length"])
        
        print(f"  English audio available: {en_count}/{self.results['total_stops']} stops")
        print(f"  Polish audio available: {pl_count}/{self.results['total_stops']} stops")
        
        # Audio length statistics
        en_lengths = [r["audio_status"]["en"]["length"] for r in self.results["detailed_results"] 
                     if r["audio_status"]["en"]["present"]]
        pl_lengths = [r["audio_status"]["pl"]["length"] for r in self.results["detailed_results"] 
                     if r["audio_status"]["pl"]["present"]]
        
        if en_lengths:
            print(f"  English audio avg length: {sum(en_lengths)//len(en_lengths):,} chars")
        if pl_lengths:
            print(f"  Polish audio avg length: {sum(pl_lengths)//len(pl_lengths):,} chars")
        
        return self.results["stops_with_audio"] == self.results["total_stops"]

def main():
    """Main testing function"""
    print("🏰 Spiš Castle Audio Tour - Backend Audio Data Testing")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    tester = AudioDataTester()
    
    # Test root endpoint first
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
        else:
            print(f"⚠️  Backend API returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach backend API: {e}")
        return False
    
    print()
    
    # Main audio data testing
    success = tester.test_tour_stops_audio_data()
    
    if success:
        # Generate final report
        all_audio_complete = tester.generate_summary_report()
        
        if all_audio_complete:
            print("\n🎉 ALL TESTS PASSED: All tour stops have complete audio data!")
            return True
        else:
            print("\n⚠️  TESTS COMPLETED WITH ISSUES: Some stops missing audio data")
            return False
    else:
        print("\n❌ TESTING FAILED: Could not complete audio data validation")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
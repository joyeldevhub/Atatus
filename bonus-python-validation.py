#!/usr/bin/env python3
"""
Bonus: Python-based OpenTelemetry Trace Validation
Automated testing with requests library
"""

import requests
import json
import time
import re
from datetime import datetime

BASE_URL = "http://localhost:3001"
METRICS_URL = "http://localhost:9090/metrics"

class OpenTelemetryValidator:
    def __init__(self):
        self.results = []
        
    def validate_trace_format(self, trace_id, span_id):
        """Validate trace and span ID formats"""
        trace_valid = bool(re.match(r'^[a-f0-9]{32}$', trace_id or ''))
        span_valid = bool(re.match(r'^[a-f0-9]{16}$', span_id or ''))
        return trace_valid, span_valid
    
    def test_endpoint(self, endpoint, expected_status=200):
        """Test individual endpoint and validate telemetry"""
        print(f"\n🔍 Testing {endpoint}")
        
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            data = response.json()
            
            # Extract telemetry data
            trace_id = data.get('trace_id')
            span_id = data.get('span_id')
            status_code = data.get('status_code')
            
            # Validate formats
            trace_valid, span_valid = self.validate_trace_format(trace_id, span_id)
            
            result = {
                'endpoint': endpoint,
                'http_status': response.status_code,
                'expected_status': expected_status,
                'trace_id': trace_id,
                'span_id': span_id,
                'trace_valid': trace_valid,
                'span_valid': span_valid,
                'status_code': status_code,
                'timestamp': datetime.now().isoformat()
            }
            
            self.results.append(result)
            
            print(f"   HTTP Status: {response.status_code} ({'✅' if response.status_code == expected_status else '❌'})")
            print(f"   Trace ID: {trace_id[:8]}... ({'✅' if trace_valid else '❌'})")
            print(f"   Span ID: {span_id[:8]}... ({'✅' if span_valid else '❌'})")
            print(f"   Status Code: {status_code} ({'✅' if status_code is not None else '❌'})")
            
            return result
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return None
    
    def test_metrics_endpoint(self):
        """Test Prometheus metrics endpoint"""
        print(f"\n📊 Testing Metrics Endpoint")
        
        try:
            response = requests.get(METRICS_URL, timeout=10)
            metrics_text = response.text
            
            # Count metrics
            metric_lines = [line for line in metrics_text.split('\n') 
                          if line and not line.startswith('#') and ' ' in line]
            
            # Look for specific Node.js metrics
            nodejs_metrics = [line for line in metric_lines if 'nodejs' in line]
            http_metrics = [line for line in metric_lines if 'http' in line]
            process_metrics = [line for line in metric_lines if 'process' in line]
            
            print(f"   Status: {response.status_code} ({'✅' if response.status_code == 200 else '❌'})")
            print(f"   Total Metrics: {len(metric_lines)}")
            print(f"   Node.js Metrics: {len(nodejs_metrics)} ({'✅' if len(nodejs_metrics) > 0 else '❌'})")
            print(f"   HTTP Metrics: {len(http_metrics)} ({'✅' if len(http_metrics) > 0 else '❌'})")
            print(f"   Process Metrics: {len(process_metrics)} ({'✅' if len(process_metrics) > 0 else '❌'})")
            
            return {
                'status': response.status_code,
                'total_metrics': len(metric_lines),
                'nodejs_metrics': len(nodejs_metrics),
                'http_metrics': len(http_metrics),
                'process_metrics': len(process_metrics)
            }
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return None
    
    def run_comprehensive_test(self):
        """Run complete validation suite"""
        print("🐍 === PYTHON AUTOMATED TRACE VALIDATION ===")
        print("🎯 Bonus Feature: Advanced validation with Python requests\n")
        
        # Test all endpoints
        self.test_endpoint('/health', 200)
        self.test_endpoint('/orders', 200)
        self.test_endpoint('/orders?fail=true', 500)
        
        # Test metrics
        metrics_result = self.test_metrics_endpoint()
        
        # Generate summary
        self.generate_summary(metrics_result)
    
    def generate_summary(self, metrics_result):
        """Generate test summary"""
        print(f"\n📋 === PYTHON VALIDATION SUMMARY ===")
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if 
                          r['http_status'] == r['expected_status'] and 
                          r['trace_valid'] and r['span_valid'])
        
        print(f"Total Endpoint Tests: {total_tests}")
        print(f"Passed Tests: {passed_tests}/{total_tests} ({(passed_tests/total_tests*100):.1f}%)")
        
        if metrics_result:
            print(f"Metrics Endpoint: ✅ Working ({metrics_result['total_metrics']} metrics)")
        else:
            print(f"Metrics Endpoint: ❌ Failed")
        
        # Trace correlation validation
        trace_ids = [r['trace_id'] for r in self.results if r['trace_id']]
        unique_traces = len(set(trace_ids))
        
        print(f"Unique Trace IDs: {unique_traces}/{len(trace_ids)} ({'✅' if unique_traces == len(trace_ids) else '❌'})")
        
        print(f"\n🎉 Python Validation: {'✅ PASS' if passed_tests == total_tests else '❌ FAIL'}")

if __name__ == "__main__":
    validator = OpenTelemetryValidator()
    validator.run_comprehensive_test()
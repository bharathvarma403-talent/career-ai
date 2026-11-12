#!/usr/bin/env python
"""
Automated live server test script for Career AI.
Spawns uvicorn on port 8000, performs live HTTP requests against all primary endpoints,
and safely terminates the server process.
"""

import subprocess
import sys
import os
import time
import requests
import json
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8000
BASE_URL = f"http://127.0.0.1:{PORT}"

def start_server():
    """Start the uvicorn server with unbuffered stdio."""
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(PORT)],
        cwd=ROOT_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

def stop_server(proc):
    """Stop the uvicorn server."""
    try:
        proc.terminate()
        proc.wait(timeout=5)
    except Exception:
        proc.kill()

def wait_for_server(timeout=15):
    """Poll health endpoint until server is ready."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            r = requests.get(f"{BASE_URL}/api/health", timeout=2)
            if r.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(0.5)
    return False

def run_live_tests():
    print(f"=== Testing Career AI Live Server on {BASE_URL} ===\n")
    
    # 1. Health
    r = requests.get(f"{BASE_URL}/api/health", timeout=5)
    print(f"1. Health Check: status={r.status_code}, data={r.json()}")
    assert r.status_code == 200, "Health check failed"

    # 2. Register
    unique_id = int(time.time())
    test_email = f"live_test_{unique_id}@example.com"
    test_password = "LivePassword123"
    
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": test_email, "password": test_password}, timeout=10)
    print(f"2. Register: status={r.status_code}")
    assert r.status_code == 200, f"Registration failed: {r.text}"
    auth_data = r.json()
    token = auth_data["access_token"]
    user_id = auth_data["user_id"]
    print(f"   User ID: {user_id}, Token: {token[:20]}...")

    # 3. Login
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": test_email, "password": test_password}, timeout=10)
    print(f"3. Login: status={r.status_code}")
    assert r.status_code == 200, f"Login failed: {r.text}"

    headers = {"Authorization": f"Bearer {token}"}

    # 4. Profile GET
    r = requests.get(f"{BASE_URL}/api/profile", headers=headers, timeout=10)
    print(f"4. Profile GET: status={r.status_code}")
    assert r.status_code == 200, f"Get profile failed: {r.text}"

    # 5. Profile PUT
    update_payload = {
        "full_name": "Live Test Candidate",
        "degree": "B.S. in Computer Science",
        "technical_skills": ["Python", "FastAPI", "React", "Docker", "SQL"],
        "desired_job_roles": ["Software Engineer"]
    }
    r = requests.put(f"{BASE_URL}/api/profile", headers=headers, json=update_payload, timeout=10)
    print(f"5. Profile PUT: status={r.status_code}")
    assert r.status_code == 200, f"Update profile failed: {r.text}"

    # 6. Career Recommendations
    r = requests.get(f"{BASE_URL}/api/career/recommendations?target_role=Software%20Engineer", headers=headers, timeout=10)
    print(f"6. Career Recommendations GET: status={r.status_code}")
    assert r.status_code == 200, f"Career recommendations failed: {r.text}"
    recs = r.json()
    assert len(recs) > 0, "No recommendations returned"
    print(f"   Match: {recs[0].get('match_percentage')}% for {recs[0].get('target_role')}")

    # 7. Skill Gaps Analysis
    r = requests.post(f"{BASE_URL}/api/skill-gaps/analyze?target_role=Software%20Engineer", headers=headers, timeout=10)
    print(f"7. Skill Gaps Analysis POST: status={r.status_code}")
    assert r.status_code == 200, f"Skill gaps failed: {r.text}"
    gaps = r.json()
    print(f"   Identified Gaps Count: {len(gaps)}")

    # 8. Chat Conversations
    r = requests.post(f"{BASE_URL}/api/chat/conversations", headers=headers, timeout=10)
    print(f"8. Create Chat Conversation: status={r.status_code}")
    assert r.status_code == 200, f"Create conversation failed: {r.text}"
    conv_id = r.json()["id"]

    # 9. Send Chat Message
    r = requests.post(
        f"{BASE_URL}/api/chat/conversations/{conv_id}/messages",
        headers=headers,
        json={"role": "user", "content": "How can I improve my resume for software engineering roles?"},
        timeout=15
    )
    print(f"9. Send Chat Message: status={r.status_code}")
    assert r.status_code == 200, f"Chat message failed: {r.text}"
    reply = r.json()["content"]
    print(f"   Advisor Reply: {reply[:100]}...")

    print("\n>>> ALL LIVE SERVER ENDPOINTS VERIFIED SUCCESSFULLY! <<<")

def is_server_running():
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=1)
        return r.status_code == 200
    except Exception:
        return False

if __name__ == "__main__":
    proc = None
    try:
        if is_server_running():
            print(f"Detected active server running on {BASE_URL}.")
        else:
            print("Starting live uvicorn server...")
            proc = start_server()
            ready = wait_for_server(timeout=15)
            if not ready:
                print("Server failed to respond to health checks in 15 seconds.")
                sys.exit(1)
        run_live_tests()
    finally:
        if proc:
            print("\nStopping live server process...")
            stop_server(proc)
            print("Server stopped cleanly.")

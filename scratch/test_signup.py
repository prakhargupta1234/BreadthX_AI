import requests

url = "http://localhost:8000/auth/signup"
data = {
    "name": "Test User",
    "email": "testuser1@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")

#!/usr/bin/env python3
"""
Load testing script for Stario Platform using Locust.

Usage:
    # Install dependencies
    pip install locust

    # Run load test (web UI)
    locust -f load-test.py --host=http://localhost:8000

    # Run headless
    locust -f load-test.py --host=http://localhost:8000 --headless -u 100 -r 10 -t 5m

    # Run with specific scenario
    locust -f load-test.py --host=http://localhost:8000 --tags video
"""

import json
import random
import string
from locust import HttpUser, task, between, tag, events
from locust.runners import MasterRunner


# Test data generators
def random_email():
    """Generate random email address."""
    chars = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"{chars}@test.stario.uz"


def random_phone():
    """Generate random Uzbek phone number."""
    return f"+99890{random.randint(1000000, 9999999)}"


def random_message():
    """Generate random greeting message."""
    greetings = [
        "Happy birthday! Wishing you all the best!",
        "Congratulations on your special day!",
        "Best wishes for your celebration!",
        "May all your dreams come true!",
        "Sending you lots of love and happiness!"
    ]
    return random.choice(greetings)


def random_recipient():
    """Generate random recipient name."""
    names = ["John", "Alice", "Amir", "Dilnoza", "Bekzod", "Malika", "Rustam", "Gulnora"]
    return random.choice(names)


# Test artist IDs (would be populated from DB in real scenario)
TEST_ARTIST_IDS = [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
]


class StarioUser(HttpUser):
    """Simulated Stario platform user."""

    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    access_token = None
    refresh_token = None

    def on_start(self):
        """Called when a simulated user starts."""
        # Register and login
        email = random_email()
        password = "TestPassword123!"

        # Register
        response = self.client.post("/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Load Test User",
            "phone": random_phone()
        })

        if response.status_code == 201:
            data = response.json()
            self.access_token = data.get("access_token")
            self.refresh_token = data.get("refresh_token")
        elif response.status_code == 409:
            # User exists, try login
            response = self.client.post("/auth/login", json={
                "email": email,
                "password": password
            })
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")

    def get_auth_headers(self):
        """Get authorization headers."""
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}

    @tag("health")
    @task(10)
    def health_check(self):
        """Check API health."""
        self.client.get("/health")

    @tag("artists")
    @task(20)
    def list_artists(self):
        """List all artists."""
        self.client.get("/artists")

    @tag("artists")
    @task(15)
    def get_artist(self):
        """Get single artist details."""
        artist_id = random.choice(TEST_ARTIST_IDS)
        self.client.get(f"/artists/{artist_id}")

    @tag("artists")
    @task(5)
    def filter_artists(self):
        """List artists with filters."""
        categories = ["singer", "actor", "blogger", "athlete"]
        self.client.get("/artists", params={
            "category": random.choice(categories),
            "country": "UZ",
            "page": 1,
            "page_size": 20
        })

    @tag("video")
    @task(5)
    def generate_video(self):
        """Generate a video (main conversion action)."""
        if not self.access_token:
            return

        response = self.client.post("/videos/generate",
            json={
                "artist_id": random.choice(TEST_ARTIST_IDS),
                "custom_message": random_message(),
                "recipient_name": random_recipient(),
                "occasion": random.choice(["birthday", "greeting", "holiday"]),
                "language": "uz",
                "duration_seconds": random.choice([15, 30, 60])
            },
            headers=self.get_auth_headers()
        )

        if response.status_code == 200:
            job_id = response.json().get("job_id")
            if job_id:
                # Poll for status
                self.client.get(f"/videos/jobs/{job_id}", headers=self.get_auth_headers())

    @tag("video")
    @task(3)
    def list_my_videos(self):
        """List user's videos."""
        if not self.access_token:
            return

        self.client.get("/videos/my", headers=self.get_auth_headers())

    @tag("face_quiz")
    @task(5)
    def start_face_quiz(self):
        """Start a face quiz."""
        if not self.access_token:
            return

        self.client.post("/face-quiz/start",
            json={
                "artist_id": random.choice(TEST_ARTIST_IDS),
                "save_photo": False
            },
            headers=self.get_auth_headers()
        )

    @tag("face_quiz")
    @task(3)
    def view_leaderboard(self):
        """View face quiz leaderboard."""
        artist_id = random.choice(TEST_ARTIST_IDS)
        self.client.get(f"/face-quiz/leaderboard/{artist_id}")

    @tag("posters")
    @task(3)
    def generate_poster(self):
        """Generate a poster."""
        if not self.access_token:
            return

        self.client.post("/posters/generate",
            json={
                "artist_id": random.choice(TEST_ARTIST_IDS),
                "text": random_message()[:50],
                "style": random.choice(["modern", "vintage", "neon"]),
                "aspect_ratio": random.choice(["1:1", "4:5", "16:9"])
            },
            headers=self.get_auth_headers()
        )

    @tag("merch")
    @task(5)
    def browse_merch(self):
        """Browse merchandise."""
        self.client.get("/merch/products")

    @tag("merch")
    @task(2)
    def view_cart(self):
        """View shopping cart."""
        if not self.access_token:
            return

        self.client.get("/merch/cart", headers=self.get_auth_headers())

    @tag("profile")
    @task(2)
    def view_profile(self):
        """View user profile."""
        if not self.access_token:
            return

        self.client.get("/users/me", headers=self.get_auth_headers())

    @tag("auth")
    @task(1)
    def refresh_token(self):
        """Refresh access token."""
        if not self.refresh_token:
            return

        response = self.client.post("/auth/refresh", json={
            "refresh_token": self.refresh_token
        })

        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")


class AdminUser(HttpUser):
    """Simulated admin user for load testing admin endpoints."""

    wait_time = between(2, 10)
    weight = 1  # Less frequent than regular users

    def on_start(self):
        """Login as admin."""
        response = self.client.post("/auth/login", json={
            "email": "admin@stario.uz",
            "password": "AdminPassword123!"
        })

        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")
        else:
            self.access_token = None

    def get_auth_headers(self):
        """Get authorization headers."""
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}

    @tag("admin")
    @task(5)
    def view_dashboard_stats(self):
        """View dashboard statistics."""
        if not self.access_token:
            return

        self.client.get("/admin/stats", headers=self.get_auth_headers())

    @tag("admin")
    @task(3)
    def view_moderation_queue(self):
        """View content moderation queue."""
        if not self.access_token:
            return

        self.client.get("/content/moderation/queue", headers=self.get_auth_headers())

    @tag("admin")
    @task(2)
    def view_audit_logs(self):
        """View audit logs."""
        if not self.access_token:
            return

        self.client.get("/content/audit-logs", headers=self.get_auth_headers())

    @tag("admin")
    @task(2)
    def list_orders(self):
        """List orders."""
        if not self.access_token:
            return

        self.client.get("/orders", headers=self.get_auth_headers())


# Event hooks for reporting
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("=" * 60)
    print("Stario Platform Load Test Starting")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("=" * 60)
    print("Stario Platform Load Test Completed")
    print("=" * 60)

    # Print summary
    stats = environment.stats.total
    print(f"Total requests: {stats.num_requests}")
    print(f"Failed requests: {stats.num_failures}")
    print(f"Median response time: {stats.median_response_time}ms")
    print(f"95th percentile: {stats.get_response_time_percentile(0.95)}ms")
    print(f"Requests/sec: {stats.total_rps}")


if __name__ == "__main__":
    import os
    os.system("locust -f load-test.py --host=http://localhost:8000")

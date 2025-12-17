#!/usr/bin/env python3
"""
Database seed script for Stario Platform.

Populates the database with test data for development and staging environments.

Usage:
    python seed-data.py [--env=development|staging] [--clear]

Options:
    --env       Environment to seed (default: development)
    --clear     Clear existing data before seeding
"""

import asyncio
import argparse
import hashlib
import random
import string
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

import asyncpg
from faker import Faker

# Initialize Faker with Uzbek and English locales
fake_uz = Faker('uz_UZ')
fake_en = Faker('en_US')


# Configuration
DATABASE_URL = "postgresql://stario:stario_dev@localhost:5432/stario"

# Test data counts
SEED_CONFIG = {
    "development": {
        "users": 100,
        "artists": 10,
        "videos": 200,
        "face_quizzes": 150,
        "orders": 50,
        "payments": 50,
        "moderation_queue": 20
    },
    "staging": {
        "users": 1000,
        "artists": 25,
        "videos": 2000,
        "face_quizzes": 1500,
        "orders": 500,
        "payments": 500,
        "moderation_queue": 100
    }
}


def hash_password(password: str) -> str:
    """Hash password using bcrypt-like format (simplified for seeding)."""
    return f"$2b$12${hashlib.sha256(password.encode()).hexdigest()[:53]}"


def random_phone() -> str:
    """Generate random Uzbek phone number."""
    prefixes = ['90', '91', '93', '94', '95', '97', '98', '99']
    return f"+998{random.choice(prefixes)}{random.randint(1000000, 9999999)}"


def random_uzs_amount() -> int:
    """Generate random UZS amount (tiyin)."""
    amounts = [25000, 50000, 75000, 100000, 150000, 200000, 500000]
    return random.choice(amounts) * 100  # Convert to tiyin


class DataGenerator:
    """Generates realistic test data for Stario platform."""

    def __init__(self, config: Dict[str, int]):
        self.config = config
        self.user_ids: List[str] = []
        self.artist_ids: List[str] = []
        self.video_ids: List[str] = []
        self.order_ids: List[str] = []

    def generate_users(self) -> List[Dict[str, Any]]:
        """Generate user records."""
        users = []

        # Admin user
        admin_id = str(uuid.uuid4())
        self.user_ids.append(admin_id)
        users.append({
            "id": admin_id,
            "email": "admin@stario.uz",
            "password_hash": hash_password("AdminPassword123!"),
            "full_name": "Admin User",
            "phone": "+998901234567",
            "role": "admin",
            "telegram_id": None,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=90)
        })

        # Operator user
        operator_id = str(uuid.uuid4())
        self.user_ids.append(operator_id)
        users.append({
            "id": operator_id,
            "email": "operator@stario.uz",
            "password_hash": hash_password("OperatorPassword123!"),
            "full_name": "Operator User",
            "phone": "+998901234568",
            "role": "operator",
            "telegram_id": None,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=60)
        })

        # Validator user
        validator_id = str(uuid.uuid4())
        self.user_ids.append(validator_id)
        users.append({
            "id": validator_id,
            "email": "validator@stario.uz",
            "password_hash": hash_password("ValidatorPassword123!"),
            "full_name": "Validator User",
            "phone": "+998901234569",
            "role": "validator",
            "telegram_id": None,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=45)
        })

        # Regular users
        for i in range(self.config["users"] - 3):
            user_id = str(uuid.uuid4())
            self.user_ids.append(user_id)

            # Mix of Uzbek and international names
            if random.random() < 0.8:
                full_name = f"{fake_uz.first_name()} {fake_uz.last_name()}"
            else:
                full_name = f"{fake_en.first_name()} {fake_en.last_name()}"

            created_at = datetime.now() - timedelta(days=random.randint(1, 90))

            users.append({
                "id": user_id,
                "email": f"user{i+1}@test.stario.uz",
                "password_hash": hash_password("TestPassword123!"),
                "full_name": full_name,
                "phone": random_phone() if random.random() < 0.7 else None,
                "role": "user",
                "telegram_id": random.randint(100000000, 999999999) if random.random() < 0.6 else None,
                "is_verified": random.random() < 0.9,
                "is_active": random.random() < 0.95,
                "created_at": created_at
            })

        return users

    def generate_artists(self) -> List[Dict[str, Any]]:
        """Generate artist records."""
        artists = []
        categories = ["singer", "actor", "blogger", "athlete", "comedian", "musician"]

        # Famous Uzbek artist names
        artist_names = [
            ("Шахзода", "Shahzoda", "singer"),
            ("Юлдуз Усмонова", "Yulduz", "singer"),
            ("Шохруххон", "Shohruhxon", "singer"),
            ("Озода Нурсаидова", "Ozoda", "singer"),
            ("Севара Назархан", "Sevara", "singer"),
            ("Райхон", "Rayhon", "singer"),
            ("Лола Юлдашева", "Lola", "singer"),
        ]

        for i in range(min(self.config["artists"], len(artist_names))):
            artist_id = str(uuid.uuid4())
            self.artist_ids.append(artist_id)

            name, stage_name, category = artist_names[i]
            verification_status = random.choice(["approved", "approved", "approved", "pending"])

            artists.append({
                "id": artist_id,
                "name": name,
                "stage_name": stage_name,
                "bio": f"Famous {category} from Uzbekistan. Known for bringing joy to millions of fans.",
                "category": category,
                "country": "UZ",
                "avatar_url": f"https://storage.stario.uz/artists/{artist_id}/avatar.jpg",
                "verification_status": verification_status,
                "is_active": verification_status == "approved",
                "total_videos": random.randint(100, 5000),
                "rating": round(random.uniform(4.0, 5.0), 2),
                "created_at": datetime.now() - timedelta(days=random.randint(30, 180))
            })

        return artists

    def generate_artist_restrictions(self) -> List[Dict[str, Any]]:
        """Generate artist restriction records."""
        restrictions = []

        for artist_id in self.artist_ids:
            restrictions.append({
                "id": str(uuid.uuid4()),
                "artist_id": artist_id,
                "whitelist_topics": ["birthday", "greeting", "holiday", "congratulation", "wedding"],
                "blacklist_topics": ["politics", "religion", "violence", "adult", "gambling"],
                "max_duration_seconds": random.choice([30, 60]),
                "custom_rules": "Family-friendly content only. No controversial topics.",
                "created_at": datetime.now() - timedelta(days=random.randint(1, 30))
            })

        return restrictions

    def generate_artist_prompts(self) -> List[Dict[str, Any]]:
        """Generate artist prompt templates."""
        prompts = []

        prompt_templates = [
            ("Birthday Greeting", "birthday", "Happy birthday, {recipient}! Wishing you all the best on your special day!"),
            ("Holiday Wishes", "holiday", "Happy holidays, {recipient}! May your celebration be filled with joy!"),
            ("Wedding Congratulations", "wedding", "Congratulations on your wedding, {recipient}! Wishing you a lifetime of happiness!"),
            ("General Greeting", "greeting", "Hello {recipient}! Sending you warm wishes and positive vibes!"),
            ("New Year", "holiday", "Happy New Year, {recipient}! May the new year bring you success and happiness!"),
            ("Graduation", "congratulation", "Congratulations on your graduation, {recipient}! The future is bright!")
        ]

        for artist_id in self.artist_ids:
            for name, category, template in prompt_templates:
                if random.random() < 0.7:  # Not all artists have all prompts
                    prompts.append({
                        "id": str(uuid.uuid4()),
                        "artist_id": artist_id,
                        "name": name,
                        "template": template,
                        "category": category,
                        "is_active": True,
                        "created_at": datetime.now() - timedelta(days=random.randint(1, 60))
                    })

        return prompts

    def generate_videos(self) -> List[Dict[str, Any]]:
        """Generate video records."""
        videos = []
        statuses = ["completed", "completed", "completed", "completed", "processing", "failed"]
        occasions = ["birthday", "greeting", "holiday", "wedding", "congratulation"]

        for _ in range(self.config["videos"]):
            video_id = str(uuid.uuid4())
            self.video_ids.append(video_id)

            status = random.choice(statuses)
            user_id = random.choice(self.user_ids)
            artist_id = random.choice(self.artist_ids)
            created_at = datetime.now() - timedelta(days=random.randint(0, 60))

            videos.append({
                "id": video_id,
                "user_id": user_id,
                "artist_id": artist_id,
                "custom_message": f"Happy {random.choice(occasions)}! This is a special message for you.",
                "recipient_name": random.choice(["Amir", "Dilnoza", "Bekzod", "Malika", "John", "Alice"]),
                "occasion": random.choice(occasions),
                "language": random.choice(["uz", "ru", "en"]),
                "duration_seconds": random.choice([15, 30, 60]),
                "video_url": f"https://storage.stario.uz/videos/{video_id}/output.mp4" if status == "completed" else None,
                "thumbnail_url": f"https://storage.stario.uz/videos/{video_id}/thumb.jpg" if status == "completed" else None,
                "status": status,
                "processing_time_ms": random.randint(20000, 45000) if status == "completed" else None,
                "error_message": "Generation failed due to content policy" if status == "failed" else None,
                "created_at": created_at,
                "completed_at": created_at + timedelta(seconds=random.randint(20, 45)) if status == "completed" else None
            })

        return videos

    def generate_face_quizzes(self) -> List[Dict[str, Any]]:
        """Generate face quiz records."""
        quizzes = []

        for _ in range(self.config["face_quizzes"]):
            quiz_id = str(uuid.uuid4())
            user_id = random.choice(self.user_ids)
            artist_id = random.choice(self.artist_ids)
            similarity_score = round(random.uniform(20.0, 95.0), 2)
            created_at = datetime.now() - timedelta(days=random.randint(0, 30))

            # Assign badge based on score
            if similarity_score >= 90:
                badge = "Twin"
            elif similarity_score >= 75:
                badge = "Lookalike"
            elif similarity_score >= 50:
                badge = "Similar"
            else:
                badge = "Unique"

            quizzes.append({
                "id": quiz_id,
                "user_id": user_id,
                "artist_id": artist_id,
                "similarity_score": similarity_score,
                "badge_earned": badge,
                "processing_time_ms": random.randint(100, 250),
                "share_image_url": f"https://storage.stario.uz/quizzes/{quiz_id}/share.jpg",
                "created_at": created_at
            })

        return quizzes

    def generate_orders(self) -> List[Dict[str, Any]]:
        """Generate order records."""
        orders = []
        statuses = ["completed", "completed", "completed", "pending", "cancelled"]

        for _ in range(self.config["orders"]):
            order_id = str(uuid.uuid4())
            self.order_ids.append(order_id)

            user_id = random.choice(self.user_ids)
            status = random.choice(statuses)
            created_at = datetime.now() - timedelta(days=random.randint(0, 60))

            orders.append({
                "id": order_id,
                "user_id": user_id,
                "total_uzs": random_uzs_amount(),
                "status": status,
                "payment_provider": random.choice(["payme", "click", "stripe"]),
                "created_at": created_at,
                "completed_at": created_at + timedelta(minutes=random.randint(1, 30)) if status == "completed" else None
            })

        return orders

    def generate_payments(self) -> List[Dict[str, Any]]:
        """Generate payment records."""
        payments = []
        providers = ["payme", "click", "stripe"]

        for order_id in self.order_ids[:self.config["payments"]]:
            payment_id = str(uuid.uuid4())
            provider = random.choice(providers)
            status = random.choice(["completed", "completed", "completed", "pending", "failed"])
            created_at = datetime.now() - timedelta(days=random.randint(0, 60))

            payments.append({
                "id": payment_id,
                "order_id": order_id,
                "provider": provider,
                "amount_uzs": random_uzs_amount(),
                "status": status,
                "provider_transaction_id": f"{provider.upper()}-{uuid.uuid4().hex[:12].upper()}",
                "created_at": created_at,
                "completed_at": created_at + timedelta(seconds=random.randint(5, 60)) if status == "completed" else None
            })

        return payments

    def generate_moderation_queue(self) -> List[Dict[str, Any]]:
        """Generate moderation queue records."""
        queue = []
        statuses = ["pending", "pending", "approved", "rejected"]
        types = ["video", "poster"]
        reasons = ["toxicity", "political", "nsfw", "violence"]

        for _ in range(self.config["moderation_queue"]):
            item_id = str(uuid.uuid4())
            status = random.choice(statuses)
            created_at = datetime.now() - timedelta(hours=random.randint(1, 72))

            queue.append({
                "id": item_id,
                "content_type": random.choice(types),
                "content_id": random.choice(self.video_ids) if self.video_ids else str(uuid.uuid4()),
                "status": status,
                "flagged_reason": random.choice(reasons),
                "confidence_score": round(random.uniform(0.7, 0.99), 2),
                "reviewer_id": random.choice(self.user_ids[:3]) if status != "pending" else None,
                "reviewer_notes": "Content reviewed and approved" if status == "approved" else (
                    "Content violates community guidelines" if status == "rejected" else None
                ),
                "created_at": created_at,
                "reviewed_at": created_at + timedelta(hours=random.randint(1, 24)) if status != "pending" else None
            })

        return queue

    def generate_audit_logs(self) -> List[Dict[str, Any]]:
        """Generate audit log records."""
        logs = []
        actions = [
            "user.login", "user.register", "user.update_profile",
            "video.generate", "video.complete", "video.share",
            "face_quiz.start", "face_quiz.complete",
            "payment.init", "payment.complete", "payment.refund",
            "artist.verify", "content.moderate"
        ]

        for _ in range(500):  # Generate 500 audit log entries
            log_id = str(uuid.uuid4())
            action = random.choice(actions)
            user_id = random.choice(self.user_ids) if self.user_ids else None
            created_at = datetime.now() - timedelta(days=random.randint(0, 89))  # 90 day retention

            logs.append({
                "id": log_id,
                "action": action,
                "actor_id": user_id,
                "resource_type": action.split(".")[0],
                "resource_id": str(uuid.uuid4()),
                "ip_address": f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}",
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
                "details": {"status": "success"},
                "created_at": created_at
            })

        return logs


async def seed_database(env: str, clear: bool = False):
    """Seed the database with test data."""
    print(f"Seeding database for environment: {env}")

    config = SEED_CONFIG.get(env, SEED_CONFIG["development"])
    generator = DataGenerator(config)

    conn = await asyncpg.connect(DATABASE_URL)

    try:
        if clear:
            print("Clearing existing data...")
            await conn.execute("TRUNCATE TABLE audit_logs CASCADE")
            await conn.execute("TRUNCATE TABLE moderation_queue CASCADE")
            await conn.execute("TRUNCATE TABLE payments CASCADE")
            await conn.execute("TRUNCATE TABLE orders CASCADE")
            await conn.execute("TRUNCATE TABLE face_quiz_results CASCADE")
            await conn.execute("TRUNCATE TABLE videos CASCADE")
            await conn.execute("TRUNCATE TABLE artist_prompts CASCADE")
            await conn.execute("TRUNCATE TABLE artist_restrictions CASCADE")
            await conn.execute("TRUNCATE TABLE artists CASCADE")
            await conn.execute("TRUNCATE TABLE users CASCADE")

        # Generate data
        print("Generating users...")
        users = generator.generate_users()

        print("Generating artists...")
        artists = generator.generate_artists()
        restrictions = generator.generate_artist_restrictions()
        prompts = generator.generate_artist_prompts()

        print("Generating videos...")
        videos = generator.generate_videos()

        print("Generating face quizzes...")
        quizzes = generator.generate_face_quizzes()

        print("Generating orders and payments...")
        orders = generator.generate_orders()
        payments = generator.generate_payments()

        print("Generating moderation queue...")
        moderation = generator.generate_moderation_queue()

        print("Generating audit logs...")
        audit_logs = generator.generate_audit_logs()

        # Insert data
        print("Inserting users...")
        for user in users:
            await conn.execute("""
                INSERT INTO users (id, email, password_hash, full_name, phone, role, telegram_id, is_verified, is_active, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (email) DO NOTHING
            """, user["id"], user["email"], user["password_hash"], user["full_name"],
                user["phone"], user["role"], user["telegram_id"], user["is_verified"],
                user["is_active"], user["created_at"])

        print("Inserting artists...")
        for artist in artists:
            await conn.execute("""
                INSERT INTO artists (id, name, stage_name, bio, category, country, avatar_url, verification_status, is_active, total_videos, rating, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT DO NOTHING
            """, artist["id"], artist["name"], artist["stage_name"], artist["bio"],
                artist["category"], artist["country"], artist["avatar_url"],
                artist["verification_status"], artist["is_active"], artist["total_videos"],
                artist["rating"], artist["created_at"])

        print("Inserting artist restrictions...")
        for restriction in restrictions:
            await conn.execute("""
                INSERT INTO artist_restrictions (id, artist_id, whitelist_topics, blacklist_topics, max_duration_seconds, custom_rules, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            """, restriction["id"], restriction["artist_id"], restriction["whitelist_topics"],
                restriction["blacklist_topics"], restriction["max_duration_seconds"],
                restriction["custom_rules"], restriction["created_at"])

        print("Inserting artist prompts...")
        for prompt in prompts:
            await conn.execute("""
                INSERT INTO artist_prompts (id, artist_id, name, template, category, is_active, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            """, prompt["id"], prompt["artist_id"], prompt["name"], prompt["template"],
                prompt["category"], prompt["is_active"], prompt["created_at"])

        print("Inserting videos...")
        for video in videos:
            await conn.execute("""
                INSERT INTO videos (id, user_id, artist_id, custom_message, recipient_name, occasion, language, duration_seconds, video_url, thumbnail_url, status, processing_time_ms, error_message, created_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT DO NOTHING
            """, video["id"], video["user_id"], video["artist_id"], video["custom_message"],
                video["recipient_name"], video["occasion"], video["language"],
                video["duration_seconds"], video["video_url"], video["thumbnail_url"],
                video["status"], video["processing_time_ms"], video["error_message"],
                video["created_at"], video["completed_at"])

        print("Inserting face quizzes...")
        for quiz in quizzes:
            await conn.execute("""
                INSERT INTO face_quiz_results (id, user_id, artist_id, similarity_score, badge_earned, processing_time_ms, share_image_url, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING
            """, quiz["id"], quiz["user_id"], quiz["artist_id"], quiz["similarity_score"],
                quiz["badge_earned"], quiz["processing_time_ms"], quiz["share_image_url"],
                quiz["created_at"])

        print("Inserting orders...")
        for order in orders:
            await conn.execute("""
                INSERT INTO orders (id, user_id, total_uzs, status, payment_provider, created_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            """, order["id"], order["user_id"], order["total_uzs"], order["status"],
                order["payment_provider"], order["created_at"], order["completed_at"])

        print("Inserting payments...")
        for payment in payments:
            await conn.execute("""
                INSERT INTO payments (id, order_id, provider, amount_uzs, status, provider_transaction_id, created_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING
            """, payment["id"], payment["order_id"], payment["provider"], payment["amount_uzs"],
                payment["status"], payment["provider_transaction_id"], payment["created_at"],
                payment["completed_at"])

        print("Inserting moderation queue...")
        for item in moderation:
            await conn.execute("""
                INSERT INTO moderation_queue (id, content_type, content_id, status, flagged_reason, confidence_score, reviewer_id, reviewer_notes, created_at, reviewed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT DO NOTHING
            """, item["id"], item["content_type"], item["content_id"], item["status"],
                item["flagged_reason"], item["confidence_score"], item["reviewer_id"],
                item["reviewer_notes"], item["created_at"], item["reviewed_at"])

        print("Inserting audit logs...")
        for log in audit_logs:
            await conn.execute("""
                INSERT INTO audit_logs (id, action, actor_id, resource_type, resource_id, ip_address, user_agent, details, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT DO NOTHING
            """, log["id"], log["action"], log["actor_id"], log["resource_type"],
                log["resource_id"], log["ip_address"], log["user_agent"],
                str(log["details"]), log["created_at"])

        print("\n" + "=" * 50)
        print("Database seeding completed!")
        print("=" * 50)
        print(f"Users: {len(users)}")
        print(f"Artists: {len(artists)}")
        print(f"Videos: {len(videos)}")
        print(f"Face Quizzes: {len(quizzes)}")
        print(f"Orders: {len(orders)}")
        print(f"Payments: {len(payments)}")
        print(f"Moderation Items: {len(moderation)}")
        print(f"Audit Logs: {len(audit_logs)}")
        print("\nTest credentials:")
        print("  Admin: admin@stario.uz / AdminPassword123!")
        print("  Operator: operator@stario.uz / OperatorPassword123!")
        print("  Validator: validator@stario.uz / ValidatorPassword123!")
        print("  User: user1@test.stario.uz / TestPassword123!")

    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Stario database with test data")
    parser.add_argument("--env", choices=["development", "staging"], default="development",
                        help="Environment to seed")
    parser.add_argument("--clear", action="store_true",
                        help="Clear existing data before seeding")

    args = parser.parse_args()

    asyncio.run(seed_database(args.env, args.clear))

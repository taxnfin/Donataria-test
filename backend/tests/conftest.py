"""Shared test configuration - credentials from environment"""
import os

TEST_EMAIL = os.getenv("TEST_EMAIL", "test@donataria.org")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "Test1234!")
BASE_URL = os.getenv("TEST_BASE_URL", "https://donataria-alertas.preview.emergentagent.com")

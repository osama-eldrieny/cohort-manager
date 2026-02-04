#!/bin/bash

# ============================================
# Student Password Setup Script
# ============================================
# This script helps set passwords for students
# Usage: ./setup_student_password.sh

API_BASE_URL="http://localhost:3002"
ADMIN_EMAIL="osama.eldrieny@gmail.com"
ADMIN_PASSWORD="Al7amdulla@8206"

echo "🔐 Student Password Setup Tool"
echo "=============================="
echo ""

# Step 1: Login as admin
echo "📝 Step 1: Getting admin session..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to login as admin"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Admin logged in successfully"
echo ""

# Step 2: Get list of students
echo "📋 Fetching students from database..."
STUDENTS=$(curl -s "$API_BASE_URL/api/students")

echo "Available Students:"
echo "$STUDENTS" | grep -o '"id":"[^"]*' | head -10

echo ""
echo "Enter student details to set password:"
echo ""

read -p "Enter Student ID (from list above): " STUDENT_ID
read -p "Enter Student Email: " STUDENT_EMAIL
read -p "Enter Password to Set: " STUDENT_PASSWORD

# Step 3: Set student password
echo ""
echo "🔐 Setting password for student..."

SET_PASSWORD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/admin/set-student-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"studentId\": \"$STUDENT_ID\", \"email\": \"$STUDENT_EMAIL\", \"password\": \"$STUDENT_PASSWORD\"}")

if echo "$SET_PASSWORD_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Password set successfully!"
  echo ""
  echo "Student can now login with:"
  echo "  Email: $STUDENT_EMAIL"
  echo "  Password: $STUDENT_PASSWORD"
else
  echo "❌ Failed to set password"
  echo "Response: $SET_PASSWORD_RESPONSE"
  exit 1
fi

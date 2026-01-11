#!/bin/bash
# Automated setup for Brain Grain backend (Linux/Mac)

echo ""
echo "======================================="
echo " Brain Grain Backend Setup (Unix)"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "[OK] Node.js is installed"
echo ""

# Run the setup script
node setup.js

#!/usr/bin/env python3
"""
SafeTrail Setup Script
Automated setup for the SafeTrail AI-powered safety navigation system
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}: {e}")
        print(f"Output: {e.output}")
        return False

def check_requirements():
    """Check if required tools are installed"""
    print("🔍 Checking system requirements...")
    
    requirements = {
        'python': 'python --version',
        'node': 'node --version',
        'npm': 'npm --version'
    }
    
    missing = []
    for tool, command in requirements.items():
        try:
            subprocess.run(command, shell=True, check=True, capture_output=True)
            print(f"✅ {tool} is installed")
        except subprocess.CalledProcessError:
            print(f"❌ {tool} is not installed")
            missing.append(tool)
    
    if missing:
        print(f"\n⚠️  Please install the following tools: {', '.join(missing)}")
        return False
    return True

def setup_environment():
    """Setup environment variables"""
    print("\n📝 Setting up environment variables...")
    
    env_example = Path('.env.example')
    env_file = Path('.env')
    
    if env_example.exists() and not env_file.exists():
        # Copy .env.example to .env
        with open(env_example, 'r') as src, open(env_file, 'w') as dst:
            content = src.read()
            dst.write(content)
        print("✅ Created .env file from .env.example")
        print("⚠️  Please edit .env file with your actual API keys")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("❌ .env.example file not found")
        return False
    
    return True

def install_dependencies():
    """Install Python and Node.js dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Install Python dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        return False
    
    # Install Node.js dependencies
    if not run_command("npm install", "Installing Node.js dependencies"):
        return False
    
    return True

def setup_database():
    """Setup database (placeholder for Supabase setup)"""
    print("\n🗄️  Database setup...")
    print("ℹ️  Database setup requires manual configuration:")
    print("   1. Create a Supabase project at https://supabase.com")
    print("   2. Add your Supabase URL and keys to .env file")
    print("   3. Run database migrations (if any)")
    return True

def main():
    """Main setup function"""
    print("🚀 SafeTrail Setup Script")
    print("=" * 50)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    steps = [
        ("Checking requirements", check_requirements),
        ("Setting up environment", setup_environment),
        ("Installing dependencies", install_dependencies),
        ("Setting up database", setup_database)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at: {step_name}")
            sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 SafeTrail setup completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Edit .env file with your API keys")
    print("   2. Start the backend: python -m uvicorn backend.main:app --reload")
    print("   3. Start the frontend: npm run dev")
    print("   4. Open http://localhost:3000 in your browser")
    print("\n📚 For more information, see README.md")

if __name__ == "__main__":
    main()

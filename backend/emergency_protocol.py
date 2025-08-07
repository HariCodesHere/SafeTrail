import os
import asyncio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    Client = None
    TWILIO_AVAILABLE = False
    print("Warning: Twilio not available. Emergency SMS will be mocked.")

from typing import List, Dict
import json
import time
from models import Location
from database import Database

class EmergencyProtocol:
    def __init__(self):
        # Initialize Twilio client
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        
        if self.twilio_sid and self.twilio_token and TWILIO_AVAILABLE:
            self.twilio_client = Client(self.twilio_sid, self.twilio_token)
        else:
            self.twilio_client = None
            print("Warning: Twilio credentials not found or Twilio not available, using mock emergency system")
    
    async def activate_emergency_protocol(self, user_id: str, location: Location, reason: str):
        """Activate full emergency protocol"""
        print(f"🚨 EMERGENCY PROTOCOL ACTIVATED for user {user_id}")
        print(f"Reason: {reason}")
        print(f"Location: {location.lat}, {location.lng}")
        
        # Stage 1: Notify trusted contacts
        await self.notify_emergency_contacts(user_id, location, reason)
        
        # Stage 2: Wait 5 minutes, then escalate to authorities
        asyncio.create_task(self.escalate_to_authorities(user_id, location, reason))
        
        # Stage 3: Activate additional safety measures
        await self.activate_safety_measures(user_id, location)
    
    async def notify_emergency_contacts(self, user_id: str, location: Location, reason: str):
        """Notify user's emergency contacts"""
        try:
            db = Database()
            await db.initialize()
            contacts = await db.get_emergency_contacts(user_id)
            
            message = f"""
🚨 SAFETRAIL EMERGENCY ALERT 🚨

{reason}

Last known location:
Latitude: {location.lat}
Longitude: {location.lng}
Google Maps: https://maps.google.com/?q={location.lat},{location.lng}

Time: {time.strftime('%Y-%m-%d %H:%M:%S')}

Please check on this person immediately or contact local authorities.
            """.strip()
            
            for contact in contacts:
                await self.send_sms(contact.get('phone'), message)
                print(f"Emergency alert sent to: {contact.get('name', 'Unknown')}")
                
        except Exception as e:
            print(f"Error notifying emergency contacts: {e}")
    
    async def escalate_to_authorities(self, user_id: str, location: Location, reason: str):
        """Escalate to emergency services after delay"""
        await asyncio.sleep(300)  # Wait 5 minutes
        
        print(f"🚨 ESCALATING TO AUTHORITIES for user {user_id}")
        
        # In a real implementation, this would:
        # 1. Call emergency services API
        # 2. Send location and user details
        # 3. Provide context about the safety concern
        
        authority_message = f"""
AUTOMATED SAFETY ALERT - SafeTrail App

User ID: {user_id}
Reason: {reason}
Location: {location.lat}, {location.lng}
Time: {time.strftime('%Y-%m-%d %H:%M:%S')}

This is an automated alert from SafeTrail safety monitoring system.
User was unresponsive to safety check-ins or triggered emergency manually.
        """.strip()
        
        # Mock emergency services notification
        print("📞 MOCK: Contacting emergency services...")
        print(authority_message)
        
        # In production, integrate with:
        # - Local emergency services APIs
        # - 911/emergency dispatch systems
        # - Security company APIs
    
    async def activate_safety_measures(self, user_id: str, location: Location):
        """Activate additional safety measures"""
        try:
            # Enable continuous location tracking
            await self.enable_continuous_tracking(user_id)
            
            # Activate phone alarm/siren (would require mobile app integration)
            await self.activate_phone_alarm(user_id)
            
            # Send location to nearby SafeTrail users (community feature)
            await self.alert_nearby_users(location)
            
        except Exception as e:
            print(f"Error activating safety measures: {e}")
    
    async def send_sms(self, phone_number: str, message: str):
        """Send SMS via Twilio"""
        try:
            if self.twilio_client and self.twilio_phone:
                message = self.twilio_client.messages.create(
                    body=message,
                    from_=self.twilio_phone,
                    to=phone_number
                )
                print(f"SMS sent successfully: {message.sid}")
            else:
                print(f"MOCK SMS to {phone_number}: {message[:100]}...")
        except Exception as e:
            print(f"Error sending SMS: {e}")
    
    async def enable_continuous_tracking(self, user_id: str):
        """Enable high-frequency location tracking"""
        print(f"📍 Enabled continuous tracking for user {user_id}")
        # Would integrate with mobile app to increase location update frequency
    
    async def activate_phone_alarm(self, user_id: str):
        """Activate phone alarm/siren"""
        print(f"🔊 Activated phone alarm for user {user_id}")
        # Would send command to mobile app to play loud alarm
    
    async def alert_nearby_users(self, location: Location):
        """Alert nearby SafeTrail users about emergency"""
        print(f"👥 Alerting nearby users about emergency at {location.lat}, {location.lng}")
        # Would notify other SafeTrail users in the area
    
    async def send_emergency_update(self, user_id: str, update: str):
        """Send update to emergency contacts about situation"""
        try:
            db = Database()
            await db.initialize()
            contacts = await db.get_emergency_contacts(user_id)
            
            message = f"""
SafeTrail Update for {user_id}:
{update}

Time: {time.strftime('%Y-%m-%d %H:%M:%S')}
            """.strip()
            
            for contact in contacts:
                await self.send_sms(contact.get('phone'), message)
                
        except Exception as e:
            print(f"Error sending emergency update: {e}")
    
    async def resolve_emergency(self, user_id: str, resolution: str):
        """Mark emergency as resolved"""
        print(f"✅ Emergency resolved for user {user_id}: {resolution}")
        
        # Notify contacts that situation is resolved
        await self.send_emergency_update(user_id, f"RESOLVED: {resolution}")
        
        # Disable emergency measures
        await self.disable_emergency_measures(user_id)
    
    async def disable_emergency_measures(self, user_id: str):
        """Disable emergency safety measures"""
        print(f"🔇 Disabled emergency measures for user {user_id}")
        # Would disable continuous tracking, alarms, etc.

#!/usr/bin/env python3
"""
Test script for signature verification system.
Creates profiles and uploads dummy signatures without requiring Django to be installed.
"""

import requests
import os
import random
import string
import argparse
from PIL import Image, ImageDraw
import io
import time
import json

def generate_random_signature(width=600, height=200):
    """Generate a random signature-like image."""
    # Create a white background
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Draw a random "signature"
    num_strokes = random.randint(5, 15)
    for _ in range(num_strokes):
        # Create random points for the signature
        points = []
        x, y = random.randint(50, width-50), random.randint(50, height-50)
        
        for _ in range(random.randint(5, 20)):
            x += random.randint(-20, 20)
            y += random.randint(-10, 10)
            points.append((x, y))
        
        # Draw the stroke
        if len(points) > 1:
            draw.line(points, fill='black', width=random.randint(2, 5))
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return img_byte_arr

def generate_variant_signature(original_signature, variation=0.3):
    """Generate a variant of an existing signature with some randomness."""
    # Load the original signature
    original = Image.open(original_signature)
    width, height = original.size
    
    # Create a new image
    new_sig = Image.new('RGB', (width, height), color='white')
    new_draw = ImageDraw.Draw(new_sig)
    
    # Get pixel data from original
    pixels = list(original.getdata())
    original_pixels = []
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if idx < len(pixels) and sum(pixels[idx][:3]) < 600:  # Dark pixels (signature)
                original_pixels.append((x, y))
    
    # Group pixels into strokes
    strokes = []
    current_stroke = []
    for x, y in original_pixels:
        if not current_stroke or max(abs(x - current_stroke[-1][0]), abs(y - current_stroke[-1][1])) < 5:
            current_stroke.append((x, y))
        else:
            if len(current_stroke) > 3:
                strokes.append(current_stroke)
            current_stroke = [(x, y)]
    
    if len(current_stroke) > 3:
        strokes.append(current_stroke)
    
    # Draw modified strokes
    for stroke in strokes:
        new_stroke = []
        for i, (x, y) in enumerate(stroke):
            # Add some randomness
            x_offset = random.uniform(-variation * 10, variation * 10)
            y_offset = random.uniform(-variation * 5, variation * 5)
            new_stroke.append((x + x_offset, y + y_offset))
        
        if len(new_stroke) > 1:
            new_draw.line(new_stroke, fill='black', width=random.randint(2, 5))
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    new_sig.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return img_byte_arr

def random_string(length=8):
    """Generate a random string."""
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

def test_signature_system(base_url, username, password, num_profiles=3, signatures_per_profile=3):
    """
    Test the signature verification system by:
    1. Creating profiles
    2. Uploading reference signatures
    3. Verifying with genuine and forged signatures
    """
    session = requests.Session()
    
    # Step 1: Login and get authentication token
    print("\n===== AUTHENTICATION =====")
    print(f"Logging in as {username}...")
    token_url = f"{base_url}/api/auth/token/"
    try:
        response = session.post(token_url, data={"username": username, "password": password})
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Login failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False
    
    token = response.json()["token"]
    headers = {"Authorization": f"Token {token}"}
    print(f"Successfully logged in and obtained token")
    
    # Step 2: Create user profiles
    print("\n===== CREATING PROFILES =====")
    created_profiles = []
    for i in range(num_profiles):
        name = f"Test User {random_string(5)}"
        id_number = f"ID-{random_string(8)}"
        
        print(f"Creating profile: {name} with ID: {id_number}")
        profile_url = f"{base_url}/api/profiles/"
        profile_data = {
            "name": name,
            "id_number": id_number
        }
        
        try:
            response = session.post(profile_url, json=profile_data, headers=headers)
            response.raise_for_status()
            profile = response.json()
            created_profiles.append(profile)
            print(f"Profile created successfully: ID={profile['id']}")
        except requests.exceptions.RequestException as e:
            print(f"Failed to create profile: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
    
    if not created_profiles:
        print("No profiles were created. Stopping test.")
        return False
    
    # Step 3: Upload reference signatures for each profile
    print("\n===== UPLOADING REFERENCE SIGNATURES =====")
    profile_signatures = {}
    
    for profile in created_profiles:
        profile_id = profile["id"]
        profile_signatures[profile_id] = []
        
        print(f"\nUploading signatures for profile: {profile['name']} (ID: {profile_id})")
        
        for j in range(signatures_per_profile):
            # Generate a random signature
            sig_image = generate_random_signature()
            
            print(f"  Uploading reference signature {j+1}...")
            
            # Upload the signature
            signature_url = f"{base_url}/api/signatures/"
            files = {
                'image': (f'signature_{j}.png', sig_image, 'image/png')
            }
            data = {
                'user_profile': profile_id,
                'notes': f"Reference signature {j+1} for {profile['name']}"
            }
            
            try:
                response = session.post(signature_url, files=files, data=data, headers=headers)
                response.raise_for_status()
                signature = response.json()
                
                # Store the signature bytes for testing variants later
                sig_image.seek(0)
                profile_signatures[profile_id].append(sig_image)
                
                print(f"  Signature uploaded: ID={signature['id']}")
            except requests.exceptions.RequestException as e:
                print(f"  Failed to upload signature: {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"  Response: {e.response.text}")
    
    # Wait for a moment to ensure all signatures are processed
    print("\nWaiting for system to process signatures...")
    time.sleep(2)
    
    # Step 4: Test verification with genuine-like and forged signatures
    print("\n===== TESTING VERIFICATION =====")
    for profile in created_profiles:
        profile_id = profile["id"]
        profile_name = profile["name"]
        
        print(f"\nPerforming verification tests for profile: {profile_name} (ID: {profile_id})")
        
        # Skip if no signatures were uploaded for this profile
        if not profile_signatures.get(profile_id):
            print(f"  No signatures available for testing. Skipping.")
            continue
        
        # Test with a genuine-like variant
        if profile_signatures[profile_id]:
            print(f"\n  Test 1: Verification with genuine-like signature")
            
            # Create a variant of one of the reference signatures
            original_sig = profile_signatures[profile_id][0]
            original_sig.seek(0)  # Reset file position
            variant_sig = generate_variant_signature(original_sig, variation=0.2)
            
            # Verify using the variant
            verify_url = f"{base_url}/api/verify/"
            files = {
                'test_signature': ('genuine_variant.png', variant_sig, 'image/png')
            }
            data = {
                'user_profile_id': profile_id,
                'save_to_references': False
            }
            
            try:
                response = session.post(verify_url, files=files, data=data, headers=headers)
                response.raise_for_status()
                result = response.json()
                
                is_genuine = result['result'] == 'genuine'
                confidence = result['confidence']
                print(f"  Verification result: {'Genuine' if is_genuine else 'Forged'} with {confidence:.2f} confidence")
                print(f"  Siamese similarity: {result['details']['metrics']['siamese_similarity']:.2f}")
                print(f"  CNN similarity: {result['details']['metrics']['cnn_similarity']:.2f}")
            except requests.exceptions.RequestException as e:
                print(f"  Verification failed: {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"  Response: {e.response.text}")
        
        # Test with a completely random signature (likely forged)
        print(f"\n  Test 2: Verification with random signature (likely forged)")
        forged_sig = generate_random_signature()
        
        verify_url = f"{base_url}/api/verify/"
        files = {
            'test_signature': ('forged.png', forged_sig, 'image/png')
        }
        data = {
            'user_profile_id': profile_id,
            'save_to_references': False
        }
        
        try:
            response = session.post(verify_url, files=files, data=data, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            is_genuine = result['result'] == 'genuine'
            confidence = result['confidence']
            print(f"  Verification result: {'Genuine' if is_genuine else 'Forged'} with {confidence:.2f} confidence")
            print(f"  Siamese similarity: {result['details']['metrics']['siamese_similarity']:.2f}")
            print(f"  CNN similarity: {result['details']['metrics']['cnn_similarity']:.2f}")
        except requests.exceptions.RequestException as e:
            print(f"  Verification failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  Response: {e.response.text}")
    
    # Step 5: Get and display verification history
    print("\n===== VERIFICATION HISTORY =====")
    verification_url = f"{base_url}/api/verification-records/"
    
    try:
        response = session.get(verification_url, headers=headers)
        response.raise_for_status()
        verifications = response.json()
        
        if verifications:
            print(f"Found {len(verifications)} verification records:")
            for i, v in enumerate(verifications[:5]):  # Show only the first 5
                print(f"  {i+1}. Profile: {v['user_profile']} - Result: {v['result']} - Confidence: {v['confidence']:.2f}")
            if len(verifications) > 5:
                print(f"  ... and {len(verifications) - 5} more records.")
        else:
            print("No verification records found.")
    except requests.exceptions.RequestException as e:
        print(f"Failed to retrieve verification history: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
    
    print("\n===== TEST COMPLETED =====")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test signature verification system with dummy data")
    parser.add_argument('--url', required=True, help="Base URL of the signature verification system (e.g., http://localhost:8000)")
    parser.add_argument('--username', required=True, help="Username for authentication")
    parser.add_argument('--password', required=True, help="Password for authentication")
    parser.add_argument('--profiles', type=int, default=2, help="Number of profiles to create")
    parser.add_argument('--signatures', type=int, default=3, help="Number of signatures per profile")
    
    args = parser.parse_args()
    
    test_signature_system(
        args.url.rstrip('/'), 
        args.username, 
        args.password, 
        args.profiles, 
        args.signatures
    )
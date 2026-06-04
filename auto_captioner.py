#!/usr/bin/env sys.executable
"""
iCloud Photos Auto-Captioner
An elegant, dependency-free utility to automatically generate descriptions
for your macOS Apple Photos Library using the Gemini API.

Created by Antigravity.
"""

import os
import sys
import json
import time
import base64
import sqlite3
import subprocess
import argparse
import urllib.request
import urllib.error

# Delimiters for bulk metadata retrieval
FIELD_DELIM = "<F>"
RECORD_DELIM = "<R>"
TEMP_EXPORT_DIR = "/Users/chriswright/Pictures/temp_caption_export"

def run_applescript(script_code):
    """Runs AppleScript code and returns stdout and stderr."""
    process = subprocess.Popen(['osascript', '-e', script_code], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = process.communicate()
    return stdout, stderr

def setup_db(db_path):
    """Initializes the SQLite database to track progress."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS processed_photos (
            photo_id TEXT PRIMARY KEY,
            filename TEXT,
            description TEXT,
            status TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

def get_photos_metadata():
    """Fetches all photos metadata from Apple Photos in a single bulk query."""
    print("Scanning Apple Photos Library (this may take 30-40 seconds for large libraries)...")
    script = f'''
    tell application "Photos"
        set allIds to id of every media item
        set allDescs to description of every media item
        set allFiles to filename of every media item
        
        set numItems to count of allIds
        set outList to {{}}
        repeat with i from 1 to numItems
            set pId to item i of allIds
            set pFile to item i of allFiles
            set pDesc to item i of allDescs
            if pDesc is missing value then
                set pDesc to ""
            end if
            copy (pId & "{FIELD_DELIM}" & pFile & "{FIELD_DELIM}" & pDesc) to end of outList
        end repeat
        
        set AppleScript's text item delimiters to "{RECORD_DELIM}"
        return outList as string
    end tell
    '''
    out, err = run_applescript(script)
    if err:
        print(f"Error scanning library: {err}")
        sys.exit(1)
        
    records = out.strip().split(RECORD_DELIM)
    photos = []
    for r in records:
        if FIELD_DELIM in r:
            parts = r.split(FIELD_DELIM, 2)
            if len(parts) == 3:
                photos.append({
                    "id": parts[0],
                    "filename": parts[1],
                    "description": parts[2]
                })
    return photos

def export_photo(photo_id, dest_dir):
    """Exports a single photo to the destination directory using AppleScript."""
    os.makedirs(dest_dir, exist_ok=True)
    # AppleScript to export a single photo
    script = f'''
    tell application "Photos"
        set aPhoto to media item id "{photo_id}"
        set destFolder to POSIX file "{dest_dir}"
        export {{aPhoto}} to destFolder
        return filename of aPhoto
    end tell
    '''
    out, err = run_applescript(script)
    if err or not out.strip():
        return None
    
    filename = out.strip()
    base_name, _ = os.path.splitext(filename)
    
    # Photos app might export as jpeg/jpg/png etc. Let's find the actual file.
    for ext in ['.jpeg', '.jpg', '.JPG', '.JPEG', '.png', '.PNG']:
        test_path = os.path.join(dest_dir, f"{base_name}{ext}")
        if os.path.exists(test_path):
            return test_path
            
    # Fallback to scanning directory for file starting with base_name
    for f in os.listdir(dest_dir):
        if f.startswith(base_name):
            return os.path.join(dest_dir, f)
            
    return None

def write_description_to_photos(photo_id, description):
    """Writes the description/caption back to Apple Photos."""
    # Escape quotes for AppleScript safety
    safe_desc = description.replace('"', '\\"')
    script = f'''
    tell application "Photos"
        set description of media item id "{photo_id}" to "{safe_desc}"
    end tell
    '''
    out, err = run_applescript(script)
    return not err

def call_gemini_api(image_path, api_key):
    """Sends the image to Gemini API and retrieves a short description."""
    try:
        # Determine mime type
        ext = os.path.splitext(image_path)[1].lower()
        mime_type = "image/jpeg"
        if ext == ".png":
            mime_type = "image/png"
            
        with open(image_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": "Provide a very short, specific description of this photo (maximum 15 words) for cataloging and search. Focus on what is in the photo (people, objects, setting). Do not write intro text like 'This photo shows' or 'In this image'. Just return the caption itself."},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": img_data
                        }
                    }
                ]
            }]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=30) as res:
            response = json.loads(res.read().decode("utf-8"))
            try:
                desc = response['candidates'][0]['content']['parts'][0]['text'].strip()
                # Clean up any trailing quotes or newline characters
                if desc.startswith('"') and desc.endswith('"'):
                    desc = desc[1:-1]
                return desc
            except (KeyError, IndexError):
                return None
    except Exception as e:
        print(f"\nAPI Error: {e}")
        return None

def test_api_connection(api_key):
    """Tests connection to Gemini API using a simple text prompt."""
    print("Testing Gemini API connection...")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": "Hello! Say 'Connection Successful' if you can read this."}]}]
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            response = json.loads(res.read().decode("utf-8"))
            text = response['candidates'][0]['content']['parts'][0]['text'].strip()
            print(f"API Response: {text}")
            return "Connection Successful" in text or len(text) > 0
    except Exception as e:
        print(f"API Connection Test Failed: {e}")
        return False

def get_api_key():
    """Loads API key from environment variable or local .env file."""
    # Check environment variable
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
        
    # Check local .env file in the current directory or workspace directory
    env_paths = [".env", "../.env", "/Users/chriswright/Documents/antigravity/friendly-faraday/.env"]
    for path in env_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    if line.strip().startswith("GEMINI_API_KEY="):
                        return line.strip().split("=", 1)[1].strip()
    return None

def main():
    parser = argparse.ArgumentParser(description="Auto-caption Apple Photos Library using Gemini API.")
    parser.add_argument("--api-key", help="Gemini API Key (can also set GEMINI_API_KEY environment variable)")
    parser.add_argument("--limit", type=int, help="Limit number of photos to process in this run")
    parser.add_argument("--dry-run", action="store_true", help="Scan library and report without captioning")
    parser.add_argument("--test-connection", action="store_true", help="Test the API connection and exit")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay in seconds between photos (default: 1.0)")
    parser.add_argument("--db-path", default="caption_progress.db", help="Path to progress tracking database")
    parser.add_argument("--force", action="store_true", help="Re-process photos that already have a caption")
    
    args = parser.parse_args()
    
    # Get API key unless doing a dry-run
    api_key = args.api_key or get_api_key()
    
    if args.test_connection:
        if not api_key:
            print("Error: API Key is required for testing connection. Set GEMINI_API_KEY or use --api-key.")
            sys.exit(1)
        success = test_api_connection(api_key)
        if success:
            print("Gemini API connection configured correctly!")
        else:
            print("Failed to connect to Gemini API. Please check your key.")
        sys.exit(0 if success else 1)
        
    if not args.dry_run and not api_key:
        print("Error: Gemini API Key not found. Please set the GEMINI_API_KEY environment variable,")
        print("provide it via --api-key, or place it in a local .env file as GEMINI_API_KEY=your_key.")
        print("To get a free key, visit: https://aistudio.google.com/")
        sys.exit(1)
        
    # Setup Database
    conn = setup_db(args.db_path)
    cursor = conn.cursor()
    
    # 1. Fetch metadata from Apple Photos
    photos = get_photos_metadata()
    total_photos = len(photos)
    print(f"Scanned {total_photos} photos in your library.")
    
    # 2. Filter photos
    to_process = []
    for p in photos:
        p_id = p["id"]
        # Check database
        cursor.execute("SELECT status, description FROM processed_photos WHERE photo_id = ?", (p_id,))
        row = cursor.fetchone()
        
        has_local_description = p["description"] != ""
        
        # Determine if we should process
        should_process = False
        if args.force:
            should_process = True
        elif has_local_description:
            # Already has a caption in Photos, skip
            should_process = False
        elif row and row[0] == "success":
            # Already successfully processed in our DB (but might not have synced back, let's update Photos just in case)
            if not has_local_description and row[1]:
                print(f"Re-applying caption to {p['filename']} from cache...")
                write_description_to_photos(p_id, row[1])
            should_process = False
        else:
            should_process = True
            
        if should_process:
            to_process.append(p)
            
    num_to_process = len(to_process)
    print(f"Photos already captioned: {total_photos - num_to_process}")
    print(f"Photos needing captions: {num_to_process}")
    
    if args.limit and args.limit < num_to_process:
        to_process = to_process[:args.limit]
        print(f"Applying limit of {args.limit} photos for this run.")
        num_to_process = len(to_process)
        
    if num_to_process == 0:
        print("All photos are already captioned! Nothing to do.")
        sys.exit(0)
        
    if args.dry_run:
        print("\n--- Dry Run Summary (No changes made) ---")
        print(f"Would process {num_to_process} photos.")
        print("First 5 photos that would be processed:")
        for p in to_process[:5]:
            print(f"- {p['filename']} (ID: {p['id']})")
        sys.exit(0)
        
    # 3. Main processing loop
    print(f"\nStarting captioning loop for {num_to_process} photos...")
    print("Press Ctrl+C to safely pause execution at any time.\n")
    
    succeeded = 0
    failed = 0
    
    # Ensure cleanup of temp export folder at exit
    try:
        for idx, p in enumerate(to_process, 1):
            p_id = p["id"]
            filename = p["filename"]
            print(f"[{idx}/{num_to_process}] Exporting {filename}... ", end="", flush=True)
            
            # Export
            img_path = export_photo(p_id, TEMP_EXPORT_DIR)
            if not img_path or not os.path.exists(img_path):
                print("FAILED (Export failed)")
                cursor.execute("INSERT OR REPLACE INTO processed_photos (photo_id, filename, description, status) VALUES (?, ?, ?, ?)",
                               (p_id, filename, "", "failed"))
                conn.commit()
                failed += 1
                continue
                
            print("describing... ", end="", flush=True)
            
            # Describe
            description = call_gemini_api(img_path, api_key)
            
            # Cleanup temp file immediately
            try:
                os.remove(img_path)
            except OSError:
                pass
                
            if not description:
                print("FAILED (API failed)")
                cursor.execute("INSERT OR REPLACE INTO processed_photos (photo_id, filename, description, status) VALUES (?, ?, ?, ?)",
                               (p_id, filename, "", "failed"))
                conn.commit()
                failed += 1
                time.sleep(args.delay)
                continue
                
            print(f"writing caption... ", end="", flush=True)
            
            # Save description back to Apple Photos
            write_success = write_description_to_photos(p_id, description)
            if write_success:
                print(f"SUCCESS: \"{description}\"")
                cursor.execute("INSERT OR REPLACE INTO processed_photos (photo_id, filename, description, status) VALUES (?, ?, ?, ?)",
                               (p_id, filename, description, "success"))
                succeeded += 1
            else:
                print("FAILED (AppleScript write error)")
                cursor.execute("INSERT OR REPLACE INTO processed_photos (photo_id, filename, description, status) VALUES (?, ?, ?, ?)",
                               (p_id, filename, description, "failed_write"))
                failed += 1
                
            conn.commit()
            
            # Sleep to respect rate limits
            time.sleep(args.delay)
            
    except KeyboardInterrupt:
        print("\n\nExecution paused by user. Progress has been saved in SQLite.")
    finally:
        # Clean up temp export dir
        if os.path.exists(TEMP_EXPORT_DIR):
            try:
                for f in os.listdir(TEMP_EXPORT_DIR):
                    os.remove(os.path.join(TEMP_EXPORT_DIR, f))
                os.rmdir(TEMP_EXPORT_DIR)
            except OSError:
                pass
        conn.close()
        
    print("\n--- Run Completed ---")
    print(f"Successfully captioned: {succeeded}")
    print(f"Failed: {failed}")
    print("You can run the script again to resume processing or retry failures.")

if __name__ == "__main__":
    main()

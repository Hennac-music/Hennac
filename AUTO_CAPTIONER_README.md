# iCloud Photos Auto-Captioner

A robust, local Python utility designed to automatically generate high-quality search captions for your macOS Apple Photos Library using the Gemini API. 

## Features

- **Zero External Dependencies**: Built entirely using Python standard libraries (no `pip install` needed).
- **SQLite Progress Cache**: Keeps track of processed photos. You can safely stop (`Ctrl+C`) and resume execution without repeating work or wasting API quota.
- **Dry-Run Mode**: Inspect which photos would be processed without making API calls or writing changes.
- **Safety Measures**: Automatically cleans up temporary exported images even if the script is interrupted.

---

## Setup Instructions

### 1. Get a Free Gemini API Key
To describe your photos, the script uses the Gemini API. You can get a free API key with a very generous rate limit (up to 15 RPM for free):
1. Go to **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with your Google account.
3. Click **Create API Key** and copy your key.

### 2. Set the API Key
You can pass the API key directly to the script, set it as an environment variable, or place it in your local `.env` file:
```bash
# Set as environment variable
export GEMINI_API_KEY="your_api_key_here"
```
Or add this line to your project's `.env` file:
```env
GEMINI_API_KEY="your_api_key_here"
```

---

## How to Run the Script

Open your Terminal, navigate to the script directory, and use the following commands:

### Test the Connection
Verify that your API key is correct and can communicate with Gemini:
```bash
python3 auto_captioner.py --test-connection
```

### Run a Dry Run
Scan your library to see how many photos need captions without making changes:
```bash
python3 auto_captioner.py --dry-run
```

### Process a Small Batch (Recommended for testing)
Describe and caption the first 10 photos to see the results:
```bash
python3 auto_captioner.py --limit 10
```

### Caption the Entire Library
Caption all remaining photos in your library:
```bash
python3 auto_captioner.py
```

### Advanced Options
- `--limit N`: Limit the run to $N$ photos.
- `--delay SECS`: Adjust the delay (in seconds) between photo processing (default is `1.0` seconds to stay within free tier rate limits).
- `--force`: Force re-processing of photos that already have a caption.
- `--db-path PATH`: Specify a custom path for the SQLite progress database (default: `caption_progress.db`).

---

## Stopping and Resuming
If you need to stop the script, press **`Ctrl+C`** in the Terminal. The script will safely finish the current photo, clean up any temp files, save its progress, and exit. Running the script again will pick up exactly where you left off.

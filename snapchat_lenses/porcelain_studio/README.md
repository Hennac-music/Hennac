# 🕯️ Studio Porcelain Matte Lens — Setup Recipe

This project directory contains all the premium, custom-designed visual assets and the exact step-by-step recipe to assemble a highly aesthetic, subtle **Matte Porcelain Skin Filter** infused with the warm, cozy, amber-bronze color grading of your recording studio!

---

## 📂 Custom Assets Provided in this Project
1. **`assets/porcelain_face_mask.png`** — A beautifully detailed face mask featuring a soft matte porcelain skin texture with ultra-subtle, warm gold and bronze metallic highlights on the cheekbones, eyelids, and nose bridge.
2. **`assets/studio_color_filter.png`** — A smooth, cozy linear gradient transitioning from a warm studio-amber glow to deep charcoal-bronze, designed to overlay your camera with a high-end cinematic studio atmosphere.

---

## 🛠️ Step-by-Step Lens Studio Assembly

Follow these simple steps inside **Lens Studio** to bring your filter to life:

### Step 1: Open a Clean Canvas
1. In Lens Studio, click **New Project** (or use the **Empty Project** template).

### Step 2: Import Your Custom Assets
1. Open your Finder and navigate to this folder:
   `/Users/chriswright/Documents/antigravity/friendly-faraday/snapchat_lenses/porcelain_studio/assets/`
2. **Drag and drop** both `porcelain_face_mask.png` and `studio_color_filter.png` directly into your **Resources panel** (located at the bottom-left of the Lens Studio interface).

---

### Step 3: Set Up Matte Skin Retouching
We will add a soft, natural base to smooth out any shine:
1. In the **Objects** (Hierarchy) panel at the top-left, click the **`+ Add Object`** button.
2. Search for **`Retouch`** and select it to add it to your scene.
3. In the **Inspector** panel (on the right), look at your new Retouch component:
   * **Soft Skin:** Set to `0.25` (a subtle 25% to keep it looking completely realistic).
   * **Teeth Whitening:** Set to `0.15` (subtle brightness).
   * **Eye Sharpening:** Set to `0.20` (crisp focus).

---

### Step 4: Add the Porcelain Highlight & Mask
Now we map the soft porcelain contour and bronze metallic highlights onto your face:
1. In the **Objects** panel, click the **`+ Add Object`** button.
2. Search for and select **`Face Mask`**.
3. With the `Face Mask` object selected, look at the **Inspector** panel on the right:
   * **Texture:** Click this slot and select the imported **`porcelain_face_mask`**.
   * **Opacity:** Dial this down to a subtle **`0.45`** (45%).
   * **Blend Mode:** Leave it as **`Normal`** (or try **`Soft Light`** for an even softer blend).
   * *This will instantly soften your skin texture and add gorgeous, warm gold/bronze metallic accents to your cheekbones and nose bridge that catch the light as you move!*

---

### Step 5: Apply the Warm Studio Color Grading
Finally, we overlay the camera feed with the exact warm, ambient mood of the music studio:
1. In the **Objects** panel, click the **`+ Add Object`** button.
2. Search for and select **`Screen Image`** (this automatically adds a *2D Screen* and *Orthographic Camera* to your scene).
3. With the new **`Screen Image`** object selected in the Objects panel, look at the **Inspector** panel:
   * **Texture:** Click this slot and select **`studio_color_filter`**.
   * **Stretch Mode:** Change this to **`Fill`** (so it stretches to fit any mobile screen perfectly).
   * **Blend Mode:** Change this to **`Soft Light`** (or **`Overlay`** for a slightly stronger contrast).
   * **Opacity:** Set this to a very subtle **`0.25`** (25%).
   * *This applies a flawless, warm cinematic amber color grading to your entire screen, mimicking professional studio lighting.*

---

## 📱 Testing Your Lens
1. Look at the **Preview** panel in the center of Lens Studio. You can swap models, change camera angles, or even use your Mac's webcam!
2. To test it live on your own phone, click the **`Send to Snapchat`** button in the top-right corner of Lens Studio, scan the Snapcode, and see your creation in action!

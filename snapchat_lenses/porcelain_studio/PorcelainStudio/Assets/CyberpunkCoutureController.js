// ============================================================================
// 🎭 Lens 2: Glitch Cyberpunk Couture Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image facePaintMask {"label": "Neon Face Paint (Mask Image)"}
// @input vec4[] neonPalettes {"label": "Neon Color Palettes"}
// @input Component.Image cameraGlitchOverlay {"label": "Camera Glitch Overlay (2D Image)"}
// @input Component.AudioComponent glitchSoundPlayer {"label": "Audio Component"}
// @input Asset.AudioTrackAsset glitchSound {"label": "Glitch Sound SFX"}
// @input float glitchDuration = 0.35 {"label": "Glitch Duration (Seconds)"}
// @input float paintFadeSpeed = 4.0 {"label": "Paint Fade Speed"}

// Cached Private Variables
var activePaletteIndex = 0;
var glitchTimer = 0.0;
var isGlitching = false;
var targetPaintOpacity = 0.0;
var currentPaintOpacity = 0.0;

// Setup Default Palette if empty
var colors = [
    new vec4(0.57, 0.0, 1.0, 1.0), // Cyberpunk Purple
    new vec4(0.0, 1.0, 0.5, 1.0),  // Toxic Green
    new vec4(0.0, 0.9, 1.0, 1.0),  // Neon Cyan
    new vec4(1.0, 0.0, 0.4, 1.0)   // Acid Pink
];

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("TapEvent").bind(onTap);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("FaceFoundEvent").bind(onFaceFound);
script.createEvent("FaceLostEvent").bind(onFaceLost);
script.createEvent("MouthOpenedEvent").bind(onMouthOpened);

function onStart() {
    print("🎭 Cyberpunk Couture: Cybernetic modules loaded.");
    
    // Safety check on custom palettes
    if (!script.neonPalettes || script.neonPalettes.length === 0) {
        script.neonPalettes = colors;
    }
    
    // Hide glitch elements
    if (script.cameraGlitchOverlay) {
        script.cameraGlitchOverlay.enabled = false;
    }
    
    // Set initial paint mask color and opacity
    updatePaintColor();
}

function updatePaintColor() {
    if (!script.facePaintMask) return;
    
    var color = script.neonPalettes[activePaletteIndex];
    // Blend active color with current opacity
    script.facePaintMask.mainPass.baseColor = new vec4(color.r, color.g, color.b, currentPaintOpacity);
}

function onTap(eventData) {
    print("👆 Cyberpunk: Screen tapped! Cycling neon palette...");
    
    // Cycle palette
    if (script.neonPalettes && script.neonPalettes.length > 0) {
        activePaletteIndex = (activePaletteIndex + 1) % script.neonPalettes.length;
        updatePaintColor();
    }
}

function onFaceFound(eventData) {
    targetPaintOpacity = 1.0;
}

function onFaceLost(eventData) {
    targetPaintOpacity = 0.0;
}

function onMouthOpened(eventData) {
    if (isGlitching) return;
    
    print("😮 Cyberpunk: Mouth opened! Triggering visual digital glitch...");
    isGlitching = true;
    glitchTimer = script.glitchDuration;
    
    if (script.cameraGlitchOverlay) {
        script.cameraGlitchOverlay.enabled = true;
    }
    
    // Play sci-fi glitch acoustic trigger
    if (script.glitchSoundPlayer && script.glitchSound) {
        script.glitchSoundPlayer.stop(false);
        script.glitchSoundPlayer.audioTrack = script.glitchSound;
        script.glitchSoundPlayer.play(1); // Play once
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // Smooth paint fade animation
    if (currentPaintOpacity !== targetPaintOpacity) {
        var diff = targetPaintOpacity - currentPaintOpacity;
        var step = diff * script.paintFadeSpeed * deltaTime;
        if (Math.abs(step) >= Math.abs(diff)) {
            currentPaintOpacity = targetPaintOpacity;
        } else {
            currentPaintOpacity += step;
        }
        updatePaintColor();
    }
    
    // Glitch frame processing
    if (isGlitching) {
        glitchTimer -= deltaTime;
        
        if (glitchTimer <= 0.0) {
            // Glitch completed
            isGlitching = false;
            if (script.cameraGlitchOverlay) {
                script.cameraGlitchOverlay.enabled = false;
            }
        } else {
            // Apply randomized glitch scales and rotations to overlay for authentic look
            if (script.cameraGlitchOverlay) {
                var screenTransform = script.cameraGlitchOverlay.getSceneObject().getComponent("Component.ScreenTransform");
                if (screenTransform) {
                    // Random scale variance to simulate digital stutter
                    var randomScale = 1.0 + (Math.random() * 0.15);
                    screenTransform.scale = new vec3(randomScale, randomScale, 1.0);
                    
                    // Random small offset
                    var randomX = (Math.random() - 0.5) * 0.1;
                    var randomY = (Math.random() - 0.5) * 0.1;
                    screenTransform.position = new vec3(randomX, randomY, 0.0);
                }
                
                // Rapidly cycle opacity of glitch overlay
                script.cameraGlitchOverlay.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, 0.4 + (Math.random() * 0.6));
            }
        }
    }
}

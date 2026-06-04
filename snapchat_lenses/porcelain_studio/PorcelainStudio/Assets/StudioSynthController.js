// ============================================================================
// 🎭 Lens 8: Studio Synth AR Keyboard Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image[] synthKeys {"label": "Synth Keys (5 Screen Images)"}
// @input vec4 keyDefaultColor = {1, 1, 1, 0.6} {"widget":"color", "label": "Default Key Color"}
// @input vec4 keyActiveColor = {0.0, 1.0, 0.9, 1.0} {"widget":"color", "label": "Active Pressed Color"}
// @input Component.AudioComponent synthAudioPlayer {"label": "Audio Component"}
// @input Asset.AudioTrackAsset[] synthNotes {"label": "Synth Notes SFX (C, D, E, G, A)"}
// @input Component.Image[] rippleCircles {"label": "Key Sound Ripples (Screen Images)"}

// Cached Private Variables
var activeKeyIndex = -1;
var keyTimers = [0.0, 0.0, 0.0, 0.0, 0.0];
var rippleTimers = [0.0, 0.0, 0.0, 0.0, 0.0];
var rippleActive = [false, false, false, false, false];
var ripplePos = [];

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("TapEvent").bind(onTap);

function onStart() {
    print("🕹️ Studio Synth: Virtual AR Synthesizer loaded and calibrated.");
    
    // Safety check key sizes
    for (var i = 0; i < script.synthKeys.length; i++) {
        if (script.synthKeys[i]) {
            script.synthKeys[i].mainPass.baseColor = script.keyDefaultColor;
        }
    }
    
    // Hide visual ripples
    for (var i = 0; i < script.rippleCircles.length; i++) {
        if (script.rippleCircles[i]) {
            script.rippleCircles[i].enabled = false;
        }
    }
}

function onTap(eventData) {
    var tapPos = eventData.getTapPosition();
    print("🎹 Studio Synth: Tap registered at coordinates X:" + tapPos.x.toFixed(2) + " Y:" + tapPos.y.toFixed(2));
    
    // We lay out 5 keys side-by-side horizontally.
    // Determine which key was tapped based on X coordinate (0.0 = Left, 1.0 = Right)
    var keyCount = script.synthKeys.length;
    if (keyCount === 0) return;
    
    var keyIndex = Math.floor(tapPos.x * keyCount);
    keyIndex = Math.max(0, Math.min(keyCount - 1, keyIndex));
    
    // Trigger Key Press mechanics
    triggerKeyPress(keyIndex, tapPos);
}

function triggerKeyPress(keyIndex, tapPos) {
    // 1. Play synthesizer frequency sound
    if (script.synthAudioPlayer && script.synthNotes && script.synthNotes[keyIndex]) {
        // Create dynamic multiple note playing or stop and play
        script.synthAudioPlayer.stop(false);
        script.synthAudioPlayer.audioTrack = script.synthNotes[keyIndex];
        script.synthAudioPlayer.play(1);
    }
    
    // 2. Set key visuals to active neon highlight
    if (script.synthKeys[keyIndex]) {
        script.synthKeys[keyIndex].mainPass.baseColor = script.keyActiveColor;
        keyTimers[keyIndex] = 0.25; // Keep active for a quarter second
    }
    
    // 3. Spawn a colorful ripple wave at touch coordinate
    // Find an inactive ripple image inside pool
    var rippleIndex = -1;
    for (var i = 0; i < rippleActive.length; i++) {
        if (!rippleActive[i]) {
            rippleIndex = i;
            break;
        }
    }
    
    // If no inactive ripple, overwrite the oldest one
    if (rippleIndex === -1) {
        rippleIndex = 0;
    }
    
    if (script.rippleCircles[rippleIndex]) {
        var ripple = script.rippleCircles[rippleIndex];
        ripple.enabled = true;
        rippleActive[rippleIndex] = true;
        rippleTimers[rippleIndex] = 0.4; // 0.4 seconds expansion lifetime
        
        var screenTransform = ripple.getSceneObject().getComponent("Component.ScreenTransform");
        if (screenTransform) {
            // Lens Studio coordinates for ScreenTransform go from -1.0 to 1.0 (origin center).
            // Input tap coordinates go from 0.0 to 1.0 (origin top-left).
            var convertedX = (tapPos.x * 2.0) - 1.0;
            var convertedY = 1.0 - (tapPos.y * 2.0); // Invert Y
            
            screenTransform.position = new vec3(convertedX, convertedY, 0.0);
            screenTransform.scale = new vec3(0.1, 0.1, 1.0); // Reset scale small
        }
        
        // Randomize ripple highlight color based on active color
        ripple.mainPass.baseColor = script.keyActiveColor;
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // 1. Decay keyboard press highlighting
    for (var i = 0; i < script.synthKeys.length; i++) {
        if (keyTimers[i] > 0.0) {
            keyTimers[i] -= deltaTime;
            if (keyTimers[i] <= 0.0) {
                keyTimers[i] = 0.0;
                if (script.synthKeys[i]) {
                    script.synthKeys[i].mainPass.baseColor = script.keyDefaultColor;
                }
            }
        }
    }
    
    // 2. Animate and expand soundwave ripple images
    for (var i = 0; i < script.rippleCircles.length; i++) {
        if (rippleActive[i]) {
            rippleTimers[i] -= deltaTime;
            
            var ripple = script.rippleCircles[i];
            if (ripple) {
                var screenTransform = ripple.getSceneObject().getComponent("Component.ScreenTransform");
                if (screenTransform) {
                    // Linearly expand scale from 0.1 to 1.4
                    var progress = (0.4 - rippleTimers[i]) / 0.4;
                    var activeScale = 0.1 + (progress * 1.3);
                    screenTransform.scale = new vec3(activeScale, activeScale, 1.0);
                }
                
                // Fade out opacity to zero as progress moves to 1.0
                var activeOpacity = 1.0 - progress;
                var color = script.keyActiveColor;
                ripple.mainPass.baseColor = new vec4(color.r, color.g, color.b, activeOpacity);
            }
            
            if (rippleTimers[i] <= 0.0) {
                rippleActive[i] = false;
                if (ripple) {
                    ripple.enabled = false;
                }
            }
        }
    }
}

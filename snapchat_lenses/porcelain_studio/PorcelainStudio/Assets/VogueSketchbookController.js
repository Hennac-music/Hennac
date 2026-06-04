// ============================================================================
// 🎭 Lens 3: Vogue Sketchbook Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Asset.Material sketchPostEffect {"label": "Sketch Post-Effect Shader"}
// @input Component.Image snapshotFlashOverlay {"label": "Camera White Flash Image"}
// @input Component.Image polaroidFrame {"label": "Retro Polaroid Frame Overlay"}
// @input Component.AudioComponent cameraShutterPlayer {"label": "Audio Component"}
// @input Asset.AudioTrackAsset cameraShutterSound {"label": "Camera Shutter Sound SFX"}
// @input float snapFreezeDuration = 2.0 {"label": "Polaroid View Duration"}

// Cached Private Variables
var flashIntensity = 0.0;
var flashDecaySpeed = 3.0;
var isViewingPolaroid = false;
var polaroidTimer = 0.0;
var polaroidOpacity = 0.0;
var targetPolaroidOpacity = 0.0;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("TapEvent").bind(onTriggerSnap);
script.createEvent("BrowsRaisedEvent").bind(onTriggerSnap);
script.createEvent("UpdateEvent").bind(onUpdate);

function onStart() {
    print("🎭 Vogue Sketchbook: Editorial sketching matrices active.");
    
    // Hide flash overlay
    if (script.snapshotFlashOverlay) {
        script.snapshotFlashOverlay.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, 0.0);
        script.snapshotFlashOverlay.enabled = true;
    }
    
    // Hide polaroid frame
    if (script.polaroidFrame) {
        script.polaroidFrame.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, 0.0);
        script.polaroidFrame.enabled = false;
    }
}

function onTriggerSnap() {
    if (isViewingPolaroid) return;
    
    print("📸 Vogue Sketchbook: Polaroid shutter snapped!");
    isViewingPolaroid = true;
    polaroidTimer = script.snapFreezeDuration;
    flashIntensity = 1.0;
    targetPolaroidOpacity = 1.0;
    
    if (script.polaroidFrame) {
        script.polaroidFrame.enabled = true;
    }
    
    // Play shutter acoustic trigger
    if (script.cameraShutterPlayer && script.cameraShutterSound) {
        script.cameraShutterPlayer.stop(false);
        script.cameraShutterPlayer.audioTrack = script.cameraShutterSound;
        script.cameraShutterPlayer.play(1);
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // Smoothly decay snapshot white flash overlay
    if (flashIntensity > 0.0) {
        flashIntensity -= flashDecaySpeed * deltaTime;
        if (flashIntensity < 0.0) flashIntensity = 0.0;
        
        if (script.snapshotFlashOverlay) {
            script.snapshotFlashOverlay.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, flashIntensity);
        }
    }
    
    // Polaroid duration and fade mechanics
    if (isViewingPolaroid) {
        polaroidTimer -= deltaTime;
        
        if (polaroidTimer <= 0.0) {
            targetPolaroidOpacity = 0.0;
        }
        
        // Handle smooth fade out/in of the border overlay
        if (polaroidOpacity !== targetPolaroidOpacity) {
            var diff = targetPolaroidOpacity - polaroidOpacity;
            var step = diff * 4.0 * deltaTime;
            if (Math.abs(step) >= Math.abs(diff)) {
                polaroidOpacity = targetPolaroidOpacity;
            } else {
                polaroidOpacity += step;
            }
            
            if (script.polaroidFrame) {
                script.polaroidFrame.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, polaroidOpacity);
            }
            
            // Disable frame object when completely transparent
            if (polaroidOpacity <= 0.0 && targetPolaroidOpacity === 0.0) {
                isViewingPolaroid = false;
                if (script.polaroidFrame) {
                    script.polaroidFrame.enabled = false;
                }
            }
        }
    }
}

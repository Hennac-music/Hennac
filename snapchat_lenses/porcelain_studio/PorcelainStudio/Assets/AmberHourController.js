// ============================================================================
// 🕯️ Amber Hour Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image colorFilterOverlay {"label": "Color Filter Overlay (Screen Image)"}
// @input Component.FaceMaskVisual faceMask {"label": "Porcelain Face Mask"}
// @input Component.AudioComponent audioComponent {"label": "Studio Audio Player"}
// @input Asset.AudioTrackAsset[] musicTracks {"label": "Cozy Licensed Audio Tracks"}
// @input float pulseSpeed = 1.0 {"widget":"slider", "min":0.1, "max":5.0, "step":0.1, "label": "Breathing Pulse Speed"}
// @input float pulseRange = 0.08 {"widget":"slider", "min":0.01, "max":0.3, "step":0.01, "label": "Pulsation Amplitude"}
// @input float baseOverlayOpacity = 0.25 {"widget":"slider", "min":0.0, "max":1.0, "step":0.05, "label": "Default Studio Mood Intensity"}
// @input float baseFaceMaskOpacity = 0.45 {"widget":"slider", "min":0.0, "max":1.0, "step":0.05, "label": "Default Face Retouch Intensity"}
// @input float faceFadeSpeed = 3.0 {"label": "Face Entrance Fade Speed"}

// Script-level private variables (Cached for performance, no garbage collection footprint in Update)
var currentTrackIndex = 0;
var targetFaceOpacity = 0.0;
var currentFaceOpacity = 0.0;
var isFaceFound = false;

// Variables to handle smooth pulse oscillations
var pulseTime = 0.0;

// Tap screen-flash state variables
var flashIntensity = 0.0;
var flashDecaySpeed = 4.0;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("TapEvent").bind(onTap);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("FaceFoundEvent").bind(onFaceFound);
script.createEvent("FaceLostEvent").bind(onFaceLost);

/**
 * Initialization lifecycle hook.
 */
function onStart() {
    print("🕯️ Amber Hour Controller: Initializing interactive elements...");
    
    // Set initial opacities to zero to allow graceful fade-in transitions
    if (script.faceMask) {
        script.faceMask.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, 0.0);
    }
    
    if (script.colorFilterOverlay) {
        script.colorFilterOverlay.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, script.baseOverlayOpacity);
    }
    
    // Begin audio track playback
    playCurrentTrack();
}

/**
 * Handles track playback, loops, and index safety checks.
 */
function playCurrentTrack() {
    if (!script.audioComponent) {
        print("⚠️ Amber Hour: AudioComponent reference is empty. Audio playback disabled.");
        return;
    }
    
    if (!script.musicTracks || script.musicTracks.length === 0) {
        print("⚠️ Amber Hour: Music track array is empty. Assign audio assets in the inspector.");
        return;
    }
    
    var activeTrack = script.musicTracks[currentTrackIndex];
    if (activeTrack) {
        print("🎵 Lens Audio: Playing track [" + activeTrack.name + "] (" + (currentTrackIndex + 1) + "/" + script.musicTracks.length + ")");
        
        // Stop current playing audio gracefully
        script.audioComponent.stop(false);
        
        // Assign and loop the selected licensed track
        script.audioComponent.audioTrack = activeTrack;
        script.audioComponent.play(-1); // -1 triggers infinite looping
    } else {
        print("⚠️ Amber Hour: Unable to load track asset at index: " + currentTrackIndex);
    }
}

/**
 * TapEvent trigger. Triggers a screen-flash transition and cycles the music track.
 */
function onTap(eventData) {
    print("👆 Interaction: Screen tapped! Cycling studio track...");
    
    // Trigger the warm camera flash overlay
    flashIntensity = 1.0;
    
    // Cycle index with wrap-around
    if (script.musicTracks && script.musicTracks.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % script.musicTracks.length;
        playCurrentTrack();
    }
}

/**
 * FaceFoundEvent trigger. Smoothly transitions the face mask from invisible to base opacity.
 */
function onFaceFound(eventData) {
    print("👤 Tracking: Face acquired! Fading in soft porcelain retouching...");
    isFaceFound = true;
    targetFaceOpacity = script.baseFaceMaskOpacity;
}

/**
 * FaceLostEvent trigger. Fades out the face mask to prevent visual snapping when face is lost.
 */
function onFaceLost(eventData) {
    print("👤 Tracking: Face lost! Fading out porcelain retouching...");
    isFaceFound = false;
    targetFaceOpacity = 0.0;
}

/**
 * High-frequency UpdateEvent frame loop. Contains highly optimized math to avoid garbage collection.
 */
function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // Update the Low Frequency Oscillator (LFO) time
    pulseTime += deltaTime * script.pulseSpeed;
    var lfo = Math.sin(pulseTime);
    
    // Smoothly fade in/out face mask based on face tracking state
    if (currentFaceOpacity !== targetFaceOpacity) {
        var diff = targetFaceOpacity - currentFaceOpacity;
        var step = diff * script.faceFadeSpeed * deltaTime;
        
        // Clamp to target to prevent numerical overrun
        if (Math.abs(step) >= Math.abs(diff)) {
            currentFaceOpacity = targetFaceOpacity;
        } else {
            currentFaceOpacity += step;
        }
    }
    
    // Interpolate tap flash decay (linear decrease to 0)
    if (flashIntensity > 0.0) {
        flashIntensity -= flashDecaySpeed * deltaTime;
        if (flashIntensity < 0.0) {
            flashIntensity = 0.0;
        }
    }
    
    // Apply dynamic breathing highlights and screen-flash additions to FaceMask opacity
    if (script.faceMask) {
        var activeFaceOpacity = currentFaceOpacity;
        
        // Add subtle breathing pulsation only when the face is actively tracked
        if (isFaceFound) {
            activeFaceOpacity += lfo * script.pulseRange;
        }
        
        // Accumulate screen tap flash highlight
        activeFaceOpacity += flashIntensity * 0.35;
        
        // Clamp opacity safely between 0.0 and 1.0
        activeFaceOpacity = Math.max(0.0, Math.min(1.0, activeFaceOpacity));
        
        script.faceMask.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, activeFaceOpacity);
    }
    
    // Apply dynamic breathing intensity to the Studio Color Grading filter
    if (script.colorFilterOverlay) {
        // Overlay oscillates at 40% of the main breathing rate to maintain subtlety
        var activeOverlayOpacity = script.baseOverlayOpacity + (lfo * script.pulseRange * 0.4);
        
        // Accumulate screen tap flash highlight
        activeOverlayOpacity += flashIntensity * 0.20;
        
        // Clamp opacity safely between 0.0 and 1.0
        activeOverlayOpacity = Math.max(0.0, Math.min(1.0, activeOverlayOpacity));
        
        script.colorFilterOverlay.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, activeOverlayOpacity);
    }
}

// ============================================================================
// 🎭 Lens 5: Helium Bubble Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.RenderMeshVisual bubbleMesh {"label": "3D Glass Bubble Mesh"}
// @input Asset.Material bubbleGlassMaterial {"label": "Glass Refractive Material"}
// @input float stretchSensitivity = 1.5 {"widget":"slider", "min":1.0, "max":2.5, "step":0.1, "label": "Brow Stretch Limit"}
// @input Component.AudioComponent popSoundPlayer {"label": "Audio Component"}
// @input Asset.AudioTrackAsset popSound {"label": "Bubble Pop Audio Track SFX"}
// @input Component.Image bubbleParticleOverlay {"label": "Floating Bubble Particle System"}

// Cached Private Variables
var targetScaleY = 1.0;
var currentScaleY = 1.0;
var isEmittingBubbles = false;
var particleTimer = 0.0;
var pulseTime = 0.0;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("BrowsRaisedEvent").bind(onBrowsRaised);
script.createEvent("BrowsReturnedEvent").bind(onBrowsReturned);
script.createEvent("MouthOpenedEvent").bind(onMouthOpened);

function onStart() {
    print("🎭 Helium Bubble: Hydrophobic grids and glass refraction channels set up.");
    
    if (script.bubbleParticleOverlay) {
        script.bubbleParticleOverlay.enabled = false;
    }
}

function onBrowsRaised(eventData) {
    print("🤨 Helium Bubble: Brows raised! Stretching helium bubble...");
    targetScaleY = script.stretchSensitivity;
}

function onBrowsReturned(eventData) {
    targetScaleY = 1.0;
}

function onMouthOpened(eventData) {
    print("😮 Helium Bubble: Mouth opened! Releasing floatation bubbles...");
    isEmittingBubbles = true;
    particleTimer = 0.8; // Duration of bubble particle burst
    
    if (script.bubbleParticleOverlay) {
        script.bubbleParticleOverlay.enabled = true;
    }
    
    // Play bubbles pop audio
    if (script.popSoundPlayer && script.popSound) {
        script.popSoundPlayer.stop(false);
        script.popSoundPlayer.audioTrack = script.popSound;
        script.popSoundPlayer.play(1);
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // Smoothly interpolate stretching transform of the bubble/head
    if (currentScaleY !== targetScaleY) {
        var diff = targetScaleY - currentScaleY;
        var step = diff * 5.0 * deltaTime;
        if (Math.abs(step) >= Math.abs(diff)) {
            currentScaleY = targetScaleY;
        } else {
            currentScaleY += step;
        }
        
        // Scale the bubble mesh along the Y axis
        if (script.bubbleMesh) {
            var transform = script.bubbleMesh.getSceneObject().getTransform();
            if (transform) {
                transform.setLocalScale(new vec3(1.0, currentScaleY, 1.0));
            }
        }
    }
    
    // Animate bubble particle lifetime
    if (isEmittingBubbles) {
        particleTimer -= deltaTime;
        if (particleTimer <= 0.0) {
            isEmittingBubbles = false;
            if (script.bubbleParticleOverlay) {
                script.bubbleParticleOverlay.enabled = false;
            }
        }
    }
    
    // Dynamic breathing LFO on glass refraction index for organic liquid look
    if (script.bubbleGlassMaterial) {
        pulseTime += deltaTime * 1.5;
        var refractionBias = 0.5 + (Math.sin(pulseTime) * 0.08);
        script.bubbleGlassMaterial.mainPass.refractionIndex = refractionBias;
    }
}

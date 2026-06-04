// ============================================================================
// 🎭 Lens 4: Retro Claymation Face Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.RenderMeshVisual faceMeshVisual {"label": "3D Face Mesh Component"}
// @input Asset.Material clayMaterial {"label": "Clay Shader Material"}
// @input float targetFPS = 8.0 {"widget":"slider", "min":2.0, "max":24.0, "step":1.0, "label": "Stop-Motion Framerate"}
// @input float deformationScale = 1.2 {"label": "Clay Stretch Intensity"}
// @input Component.AudioComponent dynamicSfxComponent {"label": "Audio Component"}
// @input Asset.AudioTrackAsset squishSound {"label": "Squishy Audio Track SFX"}

// Cached Private Variables
var frameDuration = 0.0;
var elapsedFrameTime = 0.0;
var squishPlayed = false;
var currentDeformation = 0.0;
var targetDeformation = 0.0;
var faceTracker = null;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("MouthOpenedEvent").bind(onMouthOpened);
script.createEvent("MouthClosedEvent").bind(onMouthClosed);

function onStart() {
    print("🎭 Claymation Face: Clay models sculpted and low-framerate clocks ready.");
    
    // Safety check on framerate
    if (script.targetFPS <= 0.0) {
        script.targetFPS = 8.0;
    }
    frameDuration = 1.0 / script.targetFPS;
    
    // Find Face Tracker components to inspect facial features
    var sceneObj = script.getSceneObject();
    faceTracker = sceneObj.getComponent("Component.Head");
    if (!faceTracker) {
        // Try searching parent objects
        var parent = sceneObj.getParent();
        if (parent) {
            faceTracker = parent.getComponent("Component.Head");
        }
    }
}

function onMouthOpened(eventData) {
    targetDeformation = script.deformationScale;
    
    if (!squishPlayed) {
        squishPlayed = true;
        if (script.dynamicSfxComponent && script.squishSound) {
            script.dynamicSfxComponent.stop(false);
            script.dynamicSfxComponent.audioTrack = script.squishSound;
            script.dynamicSfxComponent.play(1);
        }
    }
}

function onMouthClosed(eventData) {
    targetDeformation = 0.0;
    squishPlayed = false;
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    elapsedFrameTime += deltaTime;
    
    // Low-framerate Tick Check (Stop-motion simulation)
    if (elapsedFrameTime >= frameDuration) {
        elapsedFrameTime = 0.0; // Reset tick accumulator
        
        // Quantize clay deformation transitions to the simulated low-framerate
        if (currentDeformation !== targetDeformation) {
            currentDeformation = targetDeformation;
            
            // Set dynamic stretch parameters on the material pass
            if (script.clayMaterial) {
                // Modulate custom shader variables for organic clay stretch
                script.clayMaterial.mainPass.clayDeformWeight = currentDeformation;
            }
            
            // Apply slight stop-motion translation jitter to scene object
            var transform = script.getSceneObject().getTransform();
            if (transform) {
                var randomX = (Math.random() - 0.5) * 0.12;
                var randomY = (Math.random() - 0.5) * 0.12;
                var randomZ = (Math.random() - 0.5) * 0.08;
                transform.setLocalPosition(new vec3(randomX, randomY, randomZ));
            }
        }
    }
}

// ============================================================================
// 🎭 Lens 10: Cozy Rain on Foggy Glass Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image foggyGlassImage {"label": "Foggy Window Overlay (Fullscreen)"}
// @input Component.Image[] clearCirclesPool {"label": "Finger Clean Circles (Object Pool)"}
// @input Component.AudioComponent lofiPlayer {"label": "Studio LoFi Audio Player"}
// @input Asset.AudioTrackAsset lofiPlaylist {"label": "Cozy Rain LoFi Audio Track"}
// @input float refogRate = 0.20 {"widget":"slider", "min":0.05, "max":0.5, "step":0.05, "label": "Window Re-Fog Rate"}

// Cached Private Variables
var circleActive = [];
var circleOpacities = [];
var circleIndex = 0;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("TouchStartEvent").bind(onTouchDraw);
script.createEvent("TouchMoveEvent").bind(onTouchDraw);

function onStart() {
    print("🕹️ Cozy Rain: Condensation overlays and finger draw grids active.");
    
    // Safety check pool size
    var poolSize = script.clearCirclesPool.length;
    for (var i = 0; i < poolSize; i++) {
        circleActive[i] = false;
        circleOpacities[i] = 0.0;
        
        if (script.clearCirclesPool[i]) {
            script.clearCirclesPool[i].enabled = false;
        }
    }
    
    // Play warm rain and lofi beat
    if (script.lofiPlayer && script.lofiPlaylist) {
        script.lofiPlayer.stop(false);
        script.lofiPlayer.audioTrack = script.lofiPlaylist;
        script.lofiPlayer.play(-1); // Loop
    }
}

function onTouchDraw(eventData) {
    var touchPos = eventData.getTouchPosition();
    
    var poolSize = script.clearCirclesPool.length;
    if (poolSize === 0) return;
    
    // Cycle circle drawing index
    var idx = circleIndex;
    circleIndex = (circleIndex + 1) % poolSize;
    
    if (script.clearCirclesPool[idx]) {
        var circleObj = script.clearCirclesPool[idx];
        circleObj.enabled = true;
        circleActive[idx] = true;
        circleOpacities[idx] = 1.0; // Max transparency mask
        
        var screenTransform = circleObj.getSceneObject().getComponent("Component.ScreenTransform");
        if (screenTransform) {
            // Convert touch space (0..1, origin top-left) to ScreenTransform space (-1..1, origin center)
            var convertedX = (touchPos.x * 2.0) - 1.0;
            var convertedY = 1.0 - (touchPos.y * 2.0); // Invert Y
            
            screenTransform.position = new vec3(convertedX, convertedY, 0.0);
        }
        
        // Reset full clarity opacity
        circleObj.mainPass.baseColor = new vec4(1.0, 1.0, 1.0, 1.0);
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    var poolSize = script.clearCirclesPool.length;
    
    // Animate organic "re-fogging" decay (transparent circles fade away back to fog)
    for (var i = 0; i < poolSize; i++) {
        if (circleActive[i]) {
            circleOpacities[i] -= script.refogRate * deltaTime;
            
            if (circleOpacities[i] <= 0.0) {
                circleActive[i] = false;
                circleOpacities[i] = 0.0;
                
                if (script.clearCirclesPool[i]) {
                    script.clearCirclesPool[i].enabled = false;
                }
            } else {
                if (script.clearCirclesPool[i]) {
                    // Gradual fade out
                    script.clearCirclesPool[i].mainPass.baseColor = new vec4(1.0, 1.0, 1.0, circleOpacities[i]);
                }
            }
        }
    }
}

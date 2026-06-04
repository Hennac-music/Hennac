// ============================================================================
// 🎭 Lens 9: Neon Recording Booth Portal Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.DeviceTracking deviceTracking {"label": "Device Tracking Component"}
// @input Component.RenderMeshVisual portalDoorMesh {"label": "3D Portal Frame Mesh"}
// @input Component.RenderMeshVisual studioInsideMesh {"label": "3D Inside Studio Mesh"}
// @input Component.AudioComponent outsideAudio {"label": "Outside Ambient Sound Component"}
// @input Component.AudioComponent insideAudio {"label": "Inside Lofi Audio Component"}
// @input float crossDistance = 120.0 {"label": "Portal Proximity Radius (cm)"}

// Cached Private Variables
var isPlaced = false;
var portalPosition = new vec3(0.0, 0.0, 0.0);
var cameraObject = null;
var insideVolume = 0.0;
var outsideVolume = 0.8;
var volumeTransitionSpeed = 2.0;

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("TapEvent").bind(onTap);

function onStart() {
    print("🕹️ Portal Recording Booth: Spacial matrices and portal nodes active.");
    
    // Hide portal models until placed on floor
    if (script.portalDoorMesh) {
        script.portalDoorMesh.getSceneObject().setEnabled(false);
    }
    if (script.studioInsideMesh) {
        script.studioInsideMesh.getSceneObject().setEnabled(false);
    }
    
    // Resolve Main Camera Object
    cameraObject = global.scene.findObjectByPath("Camera");
    if (!cameraObject) {
        // Fallback search
        cameraObject = global.scene.getCamera().getSceneObject();
    }
}

function onTap(eventData) {
    if (isPlaced) return;
    
    print("🛰️ Portal: Placing neon recording portal on floor coordinate plane...");
    isPlaced = true;
    
    // Position portal object in front of camera
    if (cameraObject) {
        var camTransform = cameraObject.getTransform();
        var camPos = camTransform.getWorldPosition();
        var camForward = camTransform.getForward();
        
        // Project 180cm forward onto the floor plane (Y = constant)
        var spawnPos = camPos.add(camForward.scale(180.0));
        spawnPos.y = camPos.y - 120.0; // Place below camera height to sit on floor
        
        script.getSceneObject().getTransform().setWorldPosition(spawnPos);
        portalPosition = spawnPos;
    }
    
    // Reveal portal 3D assets
    if (script.portalDoorMesh) {
        script.portalDoorMesh.getSceneObject().setEnabled(true);
    }
    if (script.studioInsideMesh) {
        script.studioInsideMesh.getSceneObject().setEnabled(true);
    }
    
    // Begin playing cozy audio loops
    if (script.outsideAudio) {
        script.outsideAudio.stop(false);
        script.outsideAudio.volume = outsideVolume;
        script.outsideAudio.play(-1);
    }
    
    if (script.insideAudio) {
        script.insideAudio.stop(false);
        script.insideAudio.volume = insideVolume;
        script.insideAudio.play(-1);
    }
}

function onUpdate(eventData) {
    if (!isPlaced || !cameraObject) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // Track distance between camera and portal position
    var camPos = cameraObject.getTransform().getWorldPosition();
    
    // 3D vector distance calculation (centimeters)
    var diffX = camPos.x - portalPosition.x;
    var diffY = camPos.y - portalPosition.y;
    var diffZ = camPos.z - portalPosition.z;
    var distance = Math.sqrt(diffX*diffX + diffY*diffY + diffZ*diffZ);
    
    // Blending acoustic volumes based on proximity
    var targetInsideVol = 0.0;
    var targetOutsideVol = 0.8;
    
    if (distance < script.crossDistance) {
        // User has stepped inside the neon studio portal!
        targetInsideVol = 0.8;
        targetOutsideVol = 0.05;
    } else {
        // User is outside on the street
        targetInsideVol = 0.05;
        targetOutsideVol = 0.8;
    }
    
    // Interpolate inside volume
    if (insideVolume !== targetInsideVol) {
        var diff = targetInsideVol - insideVolume;
        var step = diff * volumeTransitionSpeed * deltaTime;
        if (Math.abs(step) >= Math.abs(diff)) {
            insideVolume = targetInsideVol;
        } else {
            insideVolume += step;
        }
        if (script.insideAudio) script.insideAudio.volume = insideVolume;
    }
    
    // Interpolate outside volume
    if (outsideVolume !== targetOutsideVol) {
        var diff = targetOutsideVol - outsideVolume;
        var step = diff * volumeTransitionSpeed * deltaTime;
        if (Math.abs(step) >= Math.abs(diff)) {
            outsideVolume = targetOutsideVol;
        } else {
            outsideVolume += step;
        }
        if (script.outsideAudio) script.outsideAudio.volume = outsideVolume;
    }
}

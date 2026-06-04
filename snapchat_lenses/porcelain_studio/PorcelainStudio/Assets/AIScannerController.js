// ============================================================================
// 🎭 Lens 6: Cybernetic AI Scanner Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image scannerGrid {"label": "Scanning Grid Overlay"}
// @input Component.Text statusText {"label": "Diagnostic Text Readout"}
// @input Component.AudioComponent scannerAudio {"label": "Audio Component"}
// @input Asset.AudioTrackAsset scanTickSFX {"label": "Scan Ticking Sound"}
// @input Asset.AudioTrackAsset scanDoneSFX {"label": "Scan Completed Fanfare"}

// Cached Private Variables
var isScanning = false;
var scanTimer = 0.0;
var statusPhase = 0;

// Head nod detection variables
var headTransform = null;
var lastPitch = 0.0;
var pitchVelocity = 0.0;
var nodTriggerThreshold = 0.15;
var isNodPending = false;
var nodTimer = 0.0;

// Dynamic AI Diagnostic Readings
var readings = [
    "DIAGNOSTIC: VIBE UNLOCKED\nStudio Glow: 98%\nCaffeine Level: 140%\nSass Quotient: UNSTABLE",
    "DIAGNOSTIC: SYNTH DETECTED\nCreative Level: 300%\nSleep Debt: CRITICAL\nGroove Capacity: MAXED",
    "DIAGNOSTIC: METALLIC HILITES\nAura: Amber Bronze\nTalent Score: EXTREME\nDistraction Rate: 84%",
    "DIAGNOSTIC: BRAIN SCAN\nFocus: 12%\nIdeas Incubating: 450\nBPM Internal: 120"
];

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("TapEvent").bind(triggerScan); // Fallback touch trigger

function onStart() {
    print("🎭 AI Scanner: Cybernetic arrays and scanner logic loaded.");
    
    // Attempt to resolve Head Transform
    var parent = script.getSceneObject().getParent();
    if (parent) {
        headTransform = parent.getTransform();
    } else {
        headTransform = script.getSceneObject().getTransform();
    }
    
    if (script.scannerGrid) {
        script.scannerGrid.enabled = false;
    }
    
    if (script.statusText) {
        script.statusText.text = "NOD TO SCAN PROFILE";
    }
}

function triggerScan() {
    if (isScanning) return;
    
    print("📡 AI Scanner: Initializing diagnostic sweeps...");
    isScanning = true;
    scanTimer = 3.0;
    statusPhase = 0;
    
    if (script.scannerGrid) {
        script.scannerGrid.enabled = true;
        script.scannerGrid.mainPass.baseColor = new vec4(0.0, 1.0, 0.8, 1.0); // Reset color
    }
    
    if (script.statusText) {
        script.statusText.text = "SYS: NOD DETECTED\nCALIBRATING HUD SYSTEMS...";
    }
    
    // Play tick-tick loop
    if (script.scannerAudio && script.scanTickSFX) {
        script.scannerAudio.stop(false);
        script.scannerAudio.audioTrack = script.scanTickSFX;
        script.scannerAudio.play(-1); // Loop
    }
}

function onUpdate(eventData) {
    var deltaTime = eventData.getDeltaTime();
    
    // 1. Process Head Nod Detection (only if not scanning)
    if (!isScanning && headTransform) {
        // Calculate pitch (X rotation in Euler angles)
        var rotation = headTransform.getLocalRotation();
        var euler = rotation.toEulerAngles();
        var currentPitch = euler.x;
        
        pitchVelocity = (currentPitch - lastPitch) / deltaTime;
        lastPitch = currentPitch;
        
        // Nod gesture state-machine
        if (pitchVelocity < -nodTriggerThreshold && !isNodPending) {
            isNodPending = true;
            nodTimer = 0.5; // Half-second window
        }
        
        if (isNodPending) {
            nodTimer -= deltaTime;
            if (nodTimer <= 0.0) {
                isNodPending = false;
            } else if (pitchVelocity > nodTriggerThreshold) {
                // Return pitch velocity matches, head nod successfully resolved!
                isNodPending = false;
                triggerScan();
            }
        }
    }
    
    // 2. Process HUD Scan Sweep Animation
    if (isScanning) {
        scanTimer -= deltaTime;
        
        // HUD text step animation
        if (scanTimer <= 2.0 && statusPhase === 0) {
            statusPhase = 1;
            if (script.statusText) script.statusText.text = "SYS: SCANNING CORTICAL VIBE...\nANALYZING GLOW MATRIX";
        } else if (scanTimer <= 1.0 && statusPhase === 1) {
            statusPhase = 2;
            if (script.statusText) script.statusText.text = "SYS: SCRUBBING METALLIC DATA...\nDECIPHERING AUDIO METRICS";
        }
        
        // Sweep Grid positions
        if (script.scannerGrid) {
            var gridObj = script.scannerGrid.getSceneObject();
            var screenTransform = gridObj.getComponent("Component.ScreenTransform");
            if (screenTransform) {
                // Sweeps positions from top (+1) to bottom (-1)
                var verticalPos = -1.0 + (scanTimer / 3.0) * 2.0;
                screenTransform.position = new vec3(0.0, verticalPos, 0.0);
            }
            
            // Neon pulse oscillation
            var pulse = 0.6 + (Math.sin(scanTimer * 20.0) * 0.4);
            script.scannerGrid.mainPass.baseColor = new vec4(0.0, 1.0, 0.8, pulse);
        }
        
        // Scan Completed
        if (scanTimer <= 0.0) {
            isScanning = false;
            
            if (script.scannerGrid) {
                script.scannerGrid.enabled = false;
            }
            
            // Choose a random reading
            var readIndex = Math.floor(Math.random() * readings.length);
            if (script.statusText) {
                script.statusText.text = readings[readIndex];
            }
            
            // Play sound finished
            if (script.scannerAudio) {
                script.scannerAudio.stop(false);
                if (script.scanDoneSFX) {
                    script.scannerAudio.audioTrack = script.scanDoneSFX;
                    script.scannerAudio.play(1);
                }
            }
        }
    }
}

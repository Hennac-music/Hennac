// ============================================================================
// 🎭 Lens 7: Neon Rhythm Catch Game Controller
// Custom Interactive Script for Snapchat Lens Studio
//
// strictly Event-Driven and optimized for mobile under the 150 MB RAM budget.
// ============================================================================

// @input Component.Image bucketObject {"label": "Bucket (Screen Image)"}
// @input Component.Image[] notesPool {"label": "Pre-placed Notes (Object Pool)"}
// @input Component.Text scoreText {"label": "Score HUD Text"}
// @input Component.Text livesText {"label": "Lives HUD Text"}
// @input Component.AudioComponent sfxComponent {"label": "Audio Component"}
// @input Asset.AudioTrackAsset catchSFX {"label": "Catch SFX"}
// @input Asset.AudioTrackAsset crashSFX {"label": "Miss note SFX"}
// @input float noteBaseSpeed = 0.8 {"label": "Base Fall Speed"}
// @input float tiltSensitivity = 1.8 {"label": "Head Tilt Sensitivity"}

// Game State variables
var score = 0;
var lives = 3;
var isGameOver = false;
var bucketX = 0.0;
var headTransform = null;

// Dynamic physics parameters
var notePositionsX = [];
var notePositionsY = [];
var activeNoteSpeeds = [];

// Register Event-Driven Lifecycles
script.createEvent("OnStartEvent").bind(onStart);
script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("TapEvent").bind(onTap);

function onStart() {
    print("🕹️ Rhythm Catch: Interactive note catcher loaded.");
    
    // Resolve Head component for tracking rotation
    var parent = script.getSceneObject().getParent();
    if (parent) {
        headTransform = parent.getTransform();
    } else {
        headTransform = script.getSceneObject().getTransform();
    }
    
    // Initialize object pooling
    resetGame();
}

function resetGame() {
    score = 0;
    lives = 3;
    isGameOver = false;
    bucketX = 0.0;
    
    if (script.scoreText) {
        script.scoreText.text = "SCORE: 0";
    }
    if (script.livesText) {
        script.livesText.text = "🖤 🖤 🖤";
    }
    
    // Spawn notes randomly at different heights
    for (var i = 0; i < script.notesPool.length; i++) {
        var note = script.notesPool[i];
        if (note) {
            note.enabled = true;
            notePositionsX[i] = (Math.random() - 0.5) * 1.4; // Screen space X ranges from -0.7 to 0.7
            notePositionsY[i] = 1.2 + (i * 0.45); // Spread them out vertically
            activeNoteSpeeds[i] = script.noteBaseSpeed * (0.9 + Math.random() * 0.3);
            
            updateNoteTransform(i);
        }
    }
    
    // Position bucket at screen bottom
    updateBucketTransform();
}

function updateNoteTransform(index) {
    var note = script.notesPool[index];
    if (!note) return;
    
    var transform = note.getSceneObject().getComponent("Component.ScreenTransform");
    if (transform) {
        transform.position = new vec3(notePositionsX[index], notePositionsY[index], 0.0);
    }
}

function updateBucketTransform() {
    if (!script.bucketObject) return;
    
    var transform = script.bucketObject.getSceneObject().getComponent("Component.ScreenTransform");
    if (transform) {
        // Keeps vertical height at -0.75, adjusts horizontal position
        transform.position = new vec3(bucketX, -0.75, 0.0);
    }
}

function onTap(eventData) {
    if (isGameOver) {
        print("🕹️ Rhythm Catch: Restarting...");
        resetGame();
    }
}

function triggerGameOver() {
    isGameOver = true;
    
    // Disable notes rendering
    for (var i = 0; i < script.notesPool.length; i++) {
        if (script.notesPool[i]) {
            script.notesPool[i].enabled = false;
        }
    }
    
    if (script.scoreText) {
        script.scoreText.text = "FINAL SCORE: " + score;
    }
    if (script.livesText) {
        script.livesText.text = "GAME OVER\nTAP TO REPLAY";
    }
}

function onUpdate(eventData) {
    if (isGameOver) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // 1. Resolve head Roll rotation to steer the bucket
    if (headTransform) {
        var rotation = headTransform.getLocalRotation();
        var euler = rotation.toEulerAngles();
        var roll = euler.z; // Left-Right head tilt angle in radians
        
        // Convert head roll to horizontal position (clamped between limits)
        bucketX = -roll * script.tiltSensitivity;
        bucketX = Math.max(-0.7, Math.min(0.7, bucketX));
        
        updateBucketTransform();
    }
    
    // Speed multiplier scales with score
    var speedMultiplier = 1.0 + (score / 150.0);
    
    // 2. Animate and update falling notes
    for (var i = 0; i < script.notesPool.length; i++) {
        if (!script.notesPool[i]) continue;
        
        // Apply vertical movement
        notePositionsY[i] -= activeNoteSpeeds[i] * speedMultiplier * deltaTime;
        
        // Check for bucket collision (bucket vertical position is -0.75)
        if (notePositionsY[i] <= -0.70 && notePositionsY[i] >= -0.80) {
            // Horizontal distance threshold
            if (Math.abs(notePositionsX[i] - bucketX) <= 0.22) {
                // Caught!
                score += 10;
                if (script.scoreText) {
                    script.scoreText.text = "SCORE: " + score;
                }
                
                // Play catch sound
                if (script.sfxComponent && script.catchSFX) {
                    script.sfxComponent.stop(false);
                    script.sfxComponent.audioTrack = script.catchSFX;
                    script.sfxComponent.play(1);
                }
                
                // Reset note back to top
                notePositionsX[i] = (Math.random() - 0.5) * 1.4;
                notePositionsY[i] = 1.1;
                activeNoteSpeeds[i] = script.noteBaseSpeed * (0.9 + Math.random() * 0.3);
            }
        }
        
        // Check if note missed the bucket and fell past the screen bottom
        if (notePositionsY[i] < -1.1) {
            lives--;
            
            // Play miss sound
            if (script.sfxComponent && script.crashSFX) {
                script.sfxComponent.stop(false);
                script.sfxComponent.audioTrack = script.crashSFX;
                script.sfxComponent.play(1);
            }
            
            // Update lives display
            if (script.livesText) {
                var heartString = "";
                for (var j = 0; j < 3; j++) {
                    heartString += (j < lives) ? "🖤 " : "💔 ";
                }
                script.livesText.text = heartString;
            }
            
            if (lives <= 0) {
                triggerGameOver();
                return;
            }
            
            // Reset missed note
            notePositionsX[i] = (Math.random() - 0.5) * 1.4;
            notePositionsY[i] = 1.1;
        }
        
        updateNoteTransform(i);
    }
}

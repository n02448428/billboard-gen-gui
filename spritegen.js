/**
 * Generate a sprite sheet from a 3D model
 * @param {Object} scene - The Three.js scene
 * @param {Object} camera - The Three.js camera
 * @param {Object} model - The Three.js model object
 * @param {number} resolution - The resolution of each sprite frame
 * @param {number} steps - The number of rotation steps
 * @param {number} initialAngle - The initial angle in degrees
 * @param {number} verticalAngle - The vertical angle in degrees
 * @param {number} cameraDistance - The camera distance
 * @param {number} frameFillPercentage - How much of the frame the model should fill (0-100)
 * @returns {Promise} - A promise that resolves with the sprite sheet and frames
 */
function generateSpriteSheet(scene, mainCamera, model, resolution, steps, initialAngle = 0, verticalAngle = 0, cameraDistance = 5, frameFillPercentage = 80) {
    return new Promise((resolve, reject) => {
        try {
            console.log("Starting sprite sheet generation...");
            console.log(`Resolution: ${resolution}, Steps: ${steps}, Initial Angle: ${initialAngle}, Vertical Angle: ${verticalAngle}, Camera Distance: ${cameraDistance}, Fill: ${frameFillPercentage}%`);

            // Store original model properties
            const originalRotation = model.rotation.clone();
            const originalPosition = model.position.clone();
            const originalScale = model.scale.clone();

            // Get file information
            const fileInput = document.getElementById('modelInput');
            const fileName = fileInput.files[0]?.name.toLowerCase() || '';
            const fileExtension = fileName.split('.').pop();

            console.log("Processing file:", fileName);
            console.log("File extension:", fileExtension);

            // Create a separate scene for rendering sprites (without grid)
            const spriteScene = new THREE.Scene();
            spriteScene.background = null; // Transparent background

            // Add lights to sprite scene - brighter for FBX
            if (fileExtension === 'fbx') {
                // Extra bright lighting for FBX models
                const ambientLight = new THREE.AmbientLight(0xffff, 1.5);
                spriteScene.add(ambientLight);

                const directionalLight1 = new THREE.DirectionalLight(0xffff, 1.5);
                directionalLight1.position.set(1, 1, 1);
                spriteScene.add(directionalLight1);

                const directionalLight2 = new THREE.DirectionalLight(0xffff, 1.2);
                directionalLight2.position.set(-1, 0.5, -1);
                spriteScene.add(directionalLight2);

                const directionalLight3 = new THREE.DirectionalLight(0xffff, 1.0);
                directionalLight3.position.set(0, -1, 0);
                spriteScene.add(directionalLight3);
            } else {
                // Standard lighting for other models
                const ambientLight = new THREE.AmbientLight(0xffff, 1.0);
                spriteScene.add(ambientLight);

                const directionalLight1 = new THREE.DirectionalLight(0xffff, 1.0);
                directionalLight1.position.set(1, 1, 1);
                spriteScene.add(directionalLight1);

                const directionalLight2 = new THREE.DirectionalLight(0xffff, 0.8);
                directionalLight2.position.set(-1, 0.5, -1);
                spriteScene.add(directionalLight2);
            }

            // Create a new group to hold the model clone
            const modelGroup = new THREE.Group();
            spriteScene.add(modelGroup);

            // Clone model for sprite scene
            const modelClone = model.clone();
            modelGroup.add(modelClone);

            modelClone.traverse(child => {
              if (child.isMesh && child.material) {
                // If it's an array of materials, change each one
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    mat.color = new THREE.Color(0xffffff); // White
                    mat.needsUpdate = true; // Important: update the material
                  });
                } else {
                  // Otherwise, change the single material
                  child.material.color = new THREE.Color(0xffffff); // White
                  child.material.needsUpdate = true;  // Important: update the material
                }
              }
            });
          
            // Reset model position and rotation
            modelClone.position.set(0, 0, 0);
            modelClone.rotation.set(0, 0, 0);

            // Calculate model size and center
            const box = new THREE.Box3().setFromObject(modelClone);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            console.log("Model size:", size);
            console.log("Model center:", center);

            // Different handling based on file type
            if (fileExtension === 'fbx') {
                // For FBX files, we need a completely different approach
                // Center the model with a vertical offset
                modelGroup.position.set(-center.x, -center.y + (size.y * 0.05), -center.z);

                // Apply a slightly smaller scale for FBX files to ensure nothing gets cut off
                modelGroup.scale.set(0.5, 0.5, 0.5); // Reduced from 0.6 to ensure full visibility

                // Apply additional scaling based on frameFillPercentage
                const fillScale = frameFillPercentage / 80;
                modelGroup.scale.multiplyScalar(fillScale);

                console.log("Applied FBX-specific scale:", 0.5 * fillScale);
            } else {
                // For GLB and other files, use the approach that's working well
                // Center the model
                modelGroup.position.set(-center.x, -center.y, -center.z);

                // Define base scale factor based on file type
                let baseScaleFactor;
                if (fileExtension === 'glb' || fileExtension === 'gltf') {
                    baseScaleFactor = 6.0;
                } else {
                    baseScaleFactor = 3.0;
                }

                // Apply scaling based on frameFillPercentage
                const finalScaleFactor = baseScaleFactor * (frameFillPercentage / 80);
                modelGroup.scale.multiplyScalar(finalScaleFactor);

                console.log("Base scale factor for", fileExtension, ":", baseScaleFactor);
                console.log("Applied scale factor:", finalScaleFactor);
            }

            // Create offscreen renderer for capturing frames
            const offscreenRenderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true
            });
            offscreenRenderer.setSize(resolution, resolution);
            offscreenRenderer.setClearColor(0x000000, 0); // Transparent background

            // Create a temporary container for the renderer
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            document.body.appendChild(tempContainer);
            tempContainer.appendChild(offscreenRenderer.domElement);

            // Different camera settings based on file type
            let offscreenCamera;
            let adjustedDistance;

            if (fileExtension === 'fbx') {
                // For FBX files, use a wider FOV to ensure everything is visible
                const fov = 55; // Wider FOV to ensure full visibility
                offscreenCamera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);

                // Use a slightly increased distance for FBX files to ensure nothing gets cut off
                adjustedDistance = 2.5; // Increased from 2.0 to ensure full visibility

                console.log("FBX Camera settings:");
                console.log("FOV:", fov);
                console.log("Fixed distance:", adjustedDistance);
            } else {
                // For GLB and other files, use the approach that's working well
                const fov = 45;
                offscreenCamera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);

                // Calculate camera distance based on model size and FOV
                const maxDimension = Math.max(size.x, size.y, size.z);
                const halfFovRad = THREE.MathUtils.degToRad(fov / 2);
                const optimalDistance = (maxDimension / 2) / Math.tan(halfFovRad);

                // Apply distance multiplier based on file type
                let distanceMultiplier;
                if (fileExtension === 'glb' || fileExtension === 'gltf') {
                    distanceMultiplier = 0.12;
                } else {
                    distanceMultiplier = 0.18;
                }

                adjustedDistance = optimalDistance * distanceMultiplier;

                console.log("Camera settings:");
                console.log("FOV:", fov);
                console.log("Optimal distance:", optimalDistance);
                console.log("Distance multiplier for", fileExtension, ":", distanceMultiplier);
                console.log("Adjusted distance:", adjustedDistance);
            }

            // Set initial camera position based on parameters
            const initialRadians = THREE.MathUtils.degToRad(initialAngle);
            const verticalRadians = THREE.MathUtils.degToRad(90 - verticalAngle);

            // Generate frames
            const frames = [];
            let framesCompleted = 0;

            // Function to capture a single frame
            const captureFrame = (index) => {
                return new Promise((resolveFrame, rejectFrame) => {
                    try {
                        // Calculate angle for this step
                        const angleStep = (index / steps) * Math.PI * 2;
                        const totalAngle = initialRadians + angleStep;

                        if (fileExtension === 'fbx') {
                            // For FBX files, move the camera around the model
                            // This ensures we get views from all angles
                            const x = adjustedDistance * Math.sin(totalAngle);
                            const y = adjustedDistance * 0.3; // Slightly higher camera position
                            const z = adjustedDistance * Math.cos(totalAngle);

                            // Position camera
                            offscreenCamera.position.set(x, y, z);
                            offscreenCamera.lookAt(0, 0, 0);
                        } else {
                            // For other files, move the camera around the model
                            const x = adjustedDistance * Math.sin(verticalRadians) * Math.cos(totalAngle);
                            const y = adjustedDistance * Math.cos(verticalRadians);
                            const z = adjustedDistance * Math.sin(verticalRadians) * Math.sin(totalAngle);

                            // Position camera
                            offscreenCamera.position.set(x, y, z);
                            offscreenCamera.lookAt(0, 0, 0);
                        }

                        // Render the scene
                        offscreenRenderer.render(spriteScene, offscreenCamera);

                        // Get the image data
                        const dataUrl = offscreenRenderer.domElement.toDataURL('image/png');

                        // Create image from data URL
                        const img = new Image();
                        img.onload = () => {
                            frames[index] = img;
                            framesCompleted++;

                            // Update status message
                            if (document.getElementById('statusMessage')) {
                                document.getElementById('statusMessage').textContent =
                                    `Generating frame ${framesCompleted}/${steps}...`;
                            }

                            resolveFrame();
                        };

                        img.onerror = (err) => {
                            console.error(`Error loading frame ${index}:`, err);
                            rejectFrame(new Error(`Failed to load frame ${index}`));
                        };

                        img.src = dataUrl;
                    } catch (err) {
                        console.error(`Error capturing frame ${index}:`, err);
                        rejectFrame(err);
                    }
                });
            };

            // Capture all frames sequentially
            const captureAllFrames = async () => {
                for (let i = 0; i < steps; i++) {
                    await captureFrame(i);
                }

                // Restore original model properties
                model.rotation.copy(originalRotation);
                model.position.copy(originalPosition);
                model.scale.copy(originalScale);

                // Clean up
                document.body.removeChild(tempContainer);

                // Create sprite sheet
                try {
                    const spriteSheet = await createSpriteSheetFromFrames(frames, resolution, steps);
                    resolve({
                        spriteSheet: spriteSheet,
                        frames: frames
                    });
                } catch (err) {
                    console.error("Error creating sprite sheet:", err);
                    reject(err);
                }
            };

            // Start capturing frames
            captureAllFrames().catch(err => {
                // Restore original model properties on error
                model.rotation.copy(originalRotation);
                model.position.copy(originalPosition);
                model.scale.copy(originalScale);

                // Clean up
                if (document.body.contains(tempContainer)) {
                    document.body.removeChild(tempContainer);
                }

                console.error("Error in captureAllFrames:", err);
                reject(err);
            });
        } catch (error) {
            console.error("Error in generateSpriteSheet:", error);
            reject(new Error(`Sprite generation failed: ${error.message}`));
        }
    });
}

/**
 * Create a sprite sheet from individual frames
 * @param {Array} frames - Array of Image objects
 * @param {number} resolution - The resolution of each frame
 * @param {number} steps - The number of frames
 * @returns {Promise} - A promise that resolves with the sprite sheet image
 */
function createSpriteSheetFromFrames(frames, resolution, steps) {
    return new Promise((resolve, reject) => {
        try {
            console.log("Creating sprite sheet from frames...");
            console.log(`Frames: ${frames.length}, Resolution: ${resolution}`);

            // Calculate sprite sheet dimensions
            const cols = Math.ceil(Math.sqrt(steps));
            const rows = Math.ceil(steps / cols);

            console.log(`Sprite sheet dimensions: ${cols} columns x ${rows} rows`);

            // Create canvas for sprite sheet
            const canvas = document.createElement('canvas');
            canvas.width = resolution * cols;
            canvas.height = resolution * rows;
            const ctx = canvas.getContext('2d');

            // Fill with transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw frames to sprite sheet
            for (let i = 0; i < frames.length; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * resolution;
                const y = row * resolution;

                ctx.drawImage(
                    frames[i],
                    x,
                    y,
                    resolution,
                    resolution
                );
            }

            // Convert canvas to image
            const spriteSheet = new Image();
            spriteSheet.onload = () => {
                console.log("Sprite sheet created successfully");
                resolve(spriteSheet);
            };

            spriteSheet.onerror = (err) => {
                console.error("Error creating sprite sheet image:", err);
                reject(new Error('Failed to create sprite sheet'));
            };

            // Set source to canvas data URL
            const dataUrl = canvas.toDataURL('image/png');
            spriteSheet.src = dataUrl;
        } catch (error) {
            console.error("Error in createSpriteSheetFromFrames:", error);
            reject(new Error(`Sprite sheet creation failed: ${error.message}`));
        }
    });
}

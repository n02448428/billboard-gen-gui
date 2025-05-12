// Global variables
let scene, camera, renderer, controls, model;
let isPlaying = false;
let currentFrame = 0;
let frames = [];
let animationId = null;
let gridHelper, axesHelper;

// Camera and rendering settings
let cameraDistance = 5;
let initialAngle = 0;
let verticalAngle = 0;
let frameFillPercentage = 80; // Default to 80% fill

// DOM Elements
let modelInput, scaleSlider, scaleValue, resolutionSelect, stepsInput;
let generateBtn, downloadBtn, statusMessage, modelPreviewContainer;
let spritePreview, outputCanvas, prevFrameBtn, playPauseBtn, nextFrameBtn;
let cameraDistanceSlider, initialAngleSlider, verticalAngleSlider;
let frameFillSlider, frameFillValue;
let dropZone;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    initializeDOMElements();
    
    // Initialize 3D preview
    initPreview();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize canvases
    initializeCanvases();
    
    // Set up drag and drop
    setupDragAndDrop();
    
    // Add a test cube to verify rendering is working
    addTestCube();
});

function initializeDOMElements() {
    modelInput = document.getElementById('modelInput');
    scaleSlider = document.getElementById('scale');
    scaleValue = document.getElementById('scaleValue');
    resolutionSelect = document.getElementById('resolution');
    stepsInput = document.getElementById('steps');
    generateBtn = document.getElementById('generateBtn');
    downloadBtn = document.getElementById('downloadBtn');
    statusMessage = document.getElementById('statusMessage');
    modelPreviewContainer = document.getElementById('modelPreview');
    spritePreview = document.getElementById('spritePreview');
    outputCanvas = document.getElementById('outputCanvas');
    prevFrameBtn = document.getElementById('prevFrame');
    playPauseBtn = document.getElementById('playPause');
    nextFrameBtn = document.getElementById('nextFrame');
    cameraDistanceSlider = document.getElementById('cameraDistance');
    initialAngleSlider = document.getElementById('initialAngle');
    verticalAngleSlider = document.getElementById('verticalAngle');
    frameFillSlider = document.getElementById('frameFill');
    frameFillValue = document.getElementById('frameFillValue');
    dropZone = document.getElementById('dropZone');
}

function setupEventListeners() {
    modelInput.addEventListener('change', handleModelUpload);
    scaleSlider.addEventListener('input', handleScaleChange);
    generateBtn.addEventListener('click', handleGenerateSprite);
    downloadBtn.addEventListener('click', handleDownloadSprite);
    prevFrameBtn.addEventListener('click', handlePrevFrame);
    playPauseBtn.addEventListener('click', togglePlayback);
    nextFrameBtn.addEventListener('click', handleNextFrame);
    
    if (cameraDistanceSlider) {
        cameraDistanceSlider.addEventListener('input', updateCameraPosition);
        document.getElementById('cameraDistanceValue').textContent = cameraDistanceSlider.value;
    }
    
    if (initialAngleSlider) {
        initialAngleSlider.addEventListener('input', updateInitialAngle);
        document.getElementById('initialAngleValue').textContent = initialAngleSlider.value;
    }
    
    if (verticalAngleSlider) {
        verticalAngleSlider.addEventListener('input', updateVerticalAngle);
        document.getElementById('verticalAngleValue').textContent = verticalAngleSlider.value;
    }
    
    if (frameFillSlider) {
        frameFillSlider.addEventListener('input', updateFrameFill);
        if (frameFillValue) {
            frameFillValue.textContent = frameFillSlider.value;
        }
    }
}

function setupDragAndDrop() {
    if (!dropZone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Also allow clicking the drop zone to open file dialog
    dropZone.addEventListener('click', () => {
        modelInput.click();
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropZone.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            const fileName = file.name.toLowerCase();
            
            // Check if it's a supported 3D model file
            if (isSupportedModelFile(fileName)) {
                handleModelUpload({ target: { files: [file] } });
            } else {
                showStatus(`Unsupported file format: ${getFileExtension(fileName)}. Please use a supported format.`, true);
            }
        }
    }
}

function isSupportedModelFile(fileName) {
    const supportedExtensions = ['.glb', '.gltf', '.obj', '.stl', '.fbx', '.dae', '.ply', '.vtk', '.3ds', '.x', '.mtl'];
    return supportedExtensions.some(ext => fileName.endsWith(ext));
}

function getFileExtension(fileName) {
    return fileName.slice(fileName.lastIndexOf('.'));
}

function updateFrameFill() {
    frameFillPercentage = parseInt(frameFillSlider.value);
    if (frameFillValue) {
        frameFillValue.textContent = frameFillPercentage;
    }
}

function initializeCanvases() {
    const ctx1 = spritePreview.getContext('2d');
    ctx1.fillStyle = '#f9f9f9';
    ctx1.fillRect(0, 0, spritePreview.width, spritePreview.height);
    
    const ctx2 = outputCanvas.getContext('2d');
    ctx2.fillStyle = '#f9f9f9';
    ctx2.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
}

// Add a test cube to verify rendering is working
function addTestCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);
    
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.innerHTML += 'Test cube added to verify rendering\n';
    
    // Force render update
    renderer.render(scene, camera);
}

function initPreview() {
    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Add lights with correct color values
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-1, 0.5, -1);
        scene.add(directionalLight2);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            45,
            modelPreviewContainer.clientWidth / modelPreviewContainer.clientHeight,
            0.1,
            1000
        );
        
        // Create renderer with alpha and antialias
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(modelPreviewContainer.clientWidth, modelPreviewContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Clear container and add renderer
        modelPreviewContainer.innerHTML = '';
        modelPreviewContainer.appendChild(renderer.domElement);
        
        // Add orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        
        // Set initial camera position - angled view looking down at the grid
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        controls.update();
        
        // Add helpers
        gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);
        
        axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        
        // Update debug output
        const debugOutput = document.getElementById('debugOutput');
        debugOutput.innerHTML = 'Scene initialized\n';
        debugOutput.innerHTML += 'THREE.js version: ' + THREE.REVISION + '\n';
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
    } catch (error) {
        showStatus(`Error initializing 3D preview: ${error.message}`, true);
        console.error(error);
    }
}

function onWindowResize() {
    camera.aspect = modelPreviewContainer.clientWidth / modelPreviewContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(modelPreviewContainer.clientWidth, modelPreviewContainer.clientHeight);
}

// Handle model upload
async function handleModelUpload(e) {
    if (e.target.files.length === 0) return;
    
    try {
        showStatus('Loading model...', false);
        const file = e.target.files[0];
        console.log("Loading file:", file.name, "Size:", file.size, "Type:", file.type);
        
        // Remove any existing model
        if (model) {
            scene.remove(model);
            model = null;
        }
        
        // Remove test cube if it exists
        scene.children.forEach(child => {
            if (child.geometry instanceof THREE.BoxGeometry && 
                child.material.color.getHex() === 0x00ff00) {
                scene.remove(child);
            }
        });
        
        // Remove any existing box helpers
        scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                scene.remove(child);
            }
        });
        
        await loadModel(file);
        showStatus('Model loaded successfully!', false);
    } catch (error) {
        showStatus(`Error loading model: ${error.message}`, true);
        console.error("Model loading error:", error);
    }
}

// Load 3D model
function loadModel(file) {
    return new Promise((resolve, reject) => {
        const fileURL = URL.createObjectURL(file);
        const fileName = file.name.toLowerCase();
        
        console.log("Created object URL:", fileURL);
        
        try {
            if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
                loadGLTFModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.obj')) {
                loadOBJModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.stl')) {
                loadSTLModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.fbx')) {
                loadFBXModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.dae')) {
                loadColladaModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.ply')) {
                loadPLYModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.vtk')) {
                loadVTKModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.3ds')) {
                load3DSModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.x')) {
                loadXModel(fileURL, resolve, reject);
            } else if (fileName.endsWith('.mtl')) {
                loadMTLModel(fileURL, resolve, reject);
            } else {
                reject(new Error('Unsupported file format. Please use a supported 3D model format.'));
            }
        } catch (error) {
            console.error("Error in loadModel:", error);
            reject(error);
        }
    });
}

function loadGLTFModel(fileURL, resolve, reject) {
    console.log("Loading GLTF/GLB model from:", fileURL);
    
    // Make sure GLTFLoader is available
    if (typeof THREE.GLTFLoader === 'undefined') {
        reject(new Error('GLTFLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        fileURL,
        (gltf) => {
            console.log("GLTF loaded successfully:", gltf);
            
            // The model is in gltf.scene
            model = gltf.scene;
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'Model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("GLTF loader error:", error);
            reject(new Error(`GLTF loader error: ${error.message}`));
        }
    );
}

function loadOBJModel(fileURL, resolve, reject) {
    console.log("Loading OBJ model from:", fileURL);
    
    // Make sure OBJLoader is available
    if (typeof THREE.OBJLoader === 'undefined') {
        reject(new Error('OBJLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.OBJLoader();
    
    loader.load(
        fileURL,
        (obj) => {
            console.log("OBJ loaded successfully:", obj);
            model = obj;
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'Model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("OBJ loader error:", error);
            reject(new Error(`OBJ loader error: ${error.message}`));
        }
    );
}

function loadSTLModel(fileURL, resolve, reject) {
    console.log("Loading STL model from:", fileURL);
    
    // Make sure STLLoader is available
    if (typeof THREE.STLLoader === 'undefined') {
        reject(new Error('STLLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.STLLoader();
    
    loader.load(
        fileURL,
        (geometry) => {
            console.log("STL loaded successfully:", geometry);
            
            // STL files only contain geometry, so we need to create a mesh with a material
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Create a group to hold the mesh
            model = new THREE.Group();
            model.add(mesh);
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'STL model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("STL loader error:", error);
            reject(new Error(`STL loader error: ${error.message}`));
        }
    );
}

function loadFBXModel(fileURL, resolve, reject) {
    console.log("Loading FBX model from:", fileURL);
    
    // Make sure FBXLoader is available
    if (typeof THREE.FBXLoader === 'undefined') {
        reject(new Error('FBXLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.FBXLoader();
    
    loader.load(
        fileURL,
        (fbx) => {
            console.log("FBX loaded successfully:", fbx);
            model = fbx;
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'FBX model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("FBX loader error:", error);
            reject(new Error(`FBX loader error: ${error.message}`));
        }
    );
}

function loadColladaModel(fileURL, resolve, reject) {
    console.log("Loading Collada model from:", fileURL);
    
    // Make sure ColladaLoader is available
    if (typeof THREE.ColladaLoader === 'undefined') {
        reject(new Error('ColladaLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.ColladaLoader();
    
    loader.load(
        fileURL,
        (collada) => {
            console.log("Collada loaded successfully:", collada);
            
            // The model is in collada.scene
            model = collada.scene;
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'Collada model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("Collada loader error:", error);
            reject(new Error(`Collada loader error: ${error.message}`));
        }
    );
}

function loadPLYModel(fileURL, resolve, reject) {
    console.log("Loading PLY model from:", fileURL);
    
    // Make sure PLYLoader is available
    if (typeof THREE.PLYLoader === 'undefined') {
        reject(new Error('PLYLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.PLYLoader();
    
    loader.load(
        fileURL,
        (geometry) => {
            console.log("PLY loaded successfully:", geometry);
            
            // PLY files only contain geometry, so we need to create a mesh with a material
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Create a group to hold the mesh
            model = new THREE.Group();
            model.add(mesh);
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'PLY model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("PLY loader error:", error);
            reject(new Error(`PLY loader error: ${error.message}`));
        }
    );
}

function loadVTKModel(fileURL, resolve, reject) {
    console.log("Loading VTK model from:", fileURL);
    
    // Make sure VTKLoader is available
    if (typeof THREE.VTKLoader === 'undefined') {
        reject(new Error('VTKLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.VTKLoader();
    
    loader.load(
        fileURL,
        (geometry) => {
            console.log("VTK loaded successfully:", geometry);
            
            // VTK files only contain geometry, so we need to create a mesh with a material
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Create a group to hold the mesh
            model = new THREE.Group();
            model.add(mesh);
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = 'VTK model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("VTK loader error:", error);
            reject(new Error(`VTK loader error: ${error.message}`));
        }
    );
}

function load3DSModel(fileURL, resolve, reject) {
    console.log("Loading 3DS model from:", fileURL);
    
    // Make sure TDSLoader is available
    if (typeof THREE.TDSLoader === 'undefined') {
        reject(new Error('TDSLoader is not available. Please refresh the page.'));
        return;
    }
    
    const loader = new THREE.TDSLoader();
    
    loader.load(
        fileURL,
        (object) => {
            console.log("3DS loaded successfully:", object);
            model = object;
            
            if (!model) {
                console.error("Model is null or undefined after loading");
                reject(new Error('Model failed to load correctly'));
                return;
            }
            
            // Update debug output
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.innerHTML = '3DS model loaded successfully\n';
            
            // Process the model
            processLoadedModel(model);
            
            resolve(model);
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            showStatus(`Loading model: ${Math.round(percent)}%`, false);
        },
        (error) => {
            console.error("3DS loader error:", error);
            reject(new Error(`3DS loader error: ${error.message}`));
        }
    );
}

function loadXModel(fileURL, resolve, reject) {
    // Note: THREE.js doesn't have a built-in XLoader, so we'll create a placeholder
    // In a real application, you would need to implement or find an XLoader
    console.log("Loading X model from:", fileURL);
    
    reject(new Error('DirectX (.x) loader is not currently implemented. Please use another format.'));
}

function loadMTLModel(fileURL, resolve, reject) {
    console.log("Loading MTL file from:", fileURL);
    
    // Make sure MTLLoader is available
    if (typeof THREE.MTLLoader === 'undefined') {
        reject(new Error('MTLLoader is not available. Please refresh the page.'));
        return;
    }
    
    // MTL files are material definitions, not models
    // We'll create a placeholder object to represent the MTL file
    
    // Create a simple cube as a placeholder
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        wireframe: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Create a group to hold the mesh
    model = new THREE.Group();
    model.add(mesh);
    
    // Update debug output
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.innerHTML = 'MTL file detected. Created placeholder object.\n';
    debugOutput.innerHTML += 'Note: MTL files are material definitions typically used with OBJ files.\n';
    debugOutput.innerHTML += 'For best results, load the corresponding OBJ file instead.\n';
    
    // Process the model
    processLoadedModel(model);
    
    resolve(model);
}

// Process loaded model - apply materials, center, scale
function processLoadedModel(model) {
    const debugOutput = document.getElementById('debugOutput');
    let geometryCount = 0;
    let totalVertices = 0;
    
    debugOutput.innerHTML = 'Processing model...\n';
    
    // Find all meshes in the model
    const realMeshes = [];
    
    // First pass - count geometries and fix materials
    model.traverse((child) => {
        console.log("Traversing child:", child);
        
        if (child.isMesh) {
            geometryCount++;
            
            if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                const vertexCount = child.geometry.attributes.position.count;
                totalVertices += vertexCount;
                
                if (vertexCount > 0) {
                    realMeshes.push(child);
                }
            }
            
            // Ensure material is visible
            if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    side: THREE.DoubleSide
                });
            } else if (Array.isArray(child.material)) {
                // Handle multi-material objects
                child.material.forEach(mat => {
                    ensureMaterialIsVisible(mat);
                });
            } else {
                ensureMaterialIsVisible(child.material);
            }
            
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;
            
            debugOutput.innerHTML += `Mesh: ${child.name || 'unnamed'}\n`;
            if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                debugOutput.innerHTML += `Vertices: ${child.geometry.attributes.position.count}\n`;
            }
        }
    });
    
    debugOutput.innerHTML += `\nTotal geometries: ${geometryCount}\n`;
    debugOutput.innerHTML += `Total vertices: ${totalVertices}\n`;
    debugOutput.innerHTML += `Real meshes with vertices: ${realMeshes.length}\n`;
    
    if (realMeshes.length === 0) {
        debugOutput.innerHTML += "\nWARNING: No valid meshes found in the model!\n";
        
        // Create a placeholder mesh to represent the model
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            wireframe: true
        });
        const placeholder = new THREE.Mesh(geometry, material);
        model.add(placeholder);
        
        debugOutput.innerHTML += "Added placeholder sphere to represent model\n";
    }
    
    // Add to scene first so we can calculate bounding box
    scene.add(model);
    
    // Center and scale the model
    centerAndScaleModel(realMeshes);
    
    // Force render update
    renderer.render(scene, camera);
}

function ensureMaterialIsVisible(material) {
    if (!material) return;
    
    material.side = THREE.DoubleSide;
    material.transparent = false;
    material.opacity = 1.0;
    material.needsUpdate = true;
    
    // If material has a map but it's not loaded, create a default color
    if (material.map && !material.map.image) {
        material.color = new THREE.Color(0x808080);
    }
}

// Improved centerAndScaleModel function to focus on actual geometry
function centerAndScaleModel(realMeshes) {
    try {
        if (!model) return;
        
        const debugOutput = document.getElementById('debugOutput');
        
        // Remove existing box helpers
        scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                scene.remove(child);
            }
        });
        
        // If we have real meshes with vertices, use them for centering
        if (realMeshes && realMeshes.length > 0) {
            debugOutput.innerHTML += `Using ${realMeshes.length} real meshes for centering\n`;
            
            // Create a temporary group to calculate the bounding box of just the real meshes
            const tempGroup = new THREE.Group();
            realMeshes.forEach(mesh => {
                // Clone the mesh to avoid modifying the original
                const clonedMesh = mesh.clone();
                
                // Copy the world matrix to preserve position
                clonedMesh.matrix.copy(mesh.matrixWorld);
                clonedMesh.matrixWorld.copy(mesh.matrixWorld);
                
                // Apply the matrix to position/rotation/scale
                clonedMesh.matrixAutoUpdate = false;
                
                tempGroup.add(clonedMesh);
            });
            
            // Calculate the bounding box of just the real meshes
            const box = new THREE.Box3().setFromObject(tempGroup);
            
            // If the box is empty or invalid, create a default box
            if (box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) {
                debugOutput.innerHTML += "WARNING: Invalid bounding box, creating default\n";
                box.min.set(-1, -1, -1);
                box.max.set(1, 1, 1);
            }
            
            processBoundingBox(box);
            
            // Clean up
            tempGroup.children.forEach(child => tempGroup.remove(child));
            
        } else {
            // Fall back to standard bounding box method
            const box = new THREE.Box3().setFromObject(model);
            if (box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) {
                debugOutput.innerHTML += "WARNING: Model has empty bounding box, creating default\n";
                box.min.set(-1, -1, -1);
                box.max.set(1, 1, 1);
            }
            
            processBoundingBox(box);
        }
        
    } catch (error) {
        console.error("Error in centerAndScaleModel:", error);
        showStatus(`Error centering model: ${error.message}`, true);
    }
    
    // Helper function to process a bounding box
    function processBoundingBox(box) {
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        debugOutput.innerHTML += `\nBounding box:\n`;
        debugOutput.innerHTML += `Min: (${box.min.x.toFixed(2)}, ${box.min.y.toFixed(2)}, ${box.min.z.toFixed(2)})\n`;
        debugOutput.innerHTML += `Max: (${box.max.x.toFixed(2)}, ${box.max.y.toFixed(2)}, ${box.max.z.toFixed(2)})\n`;
        debugOutput.innerHTML += `Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}\n`;
        debugOutput.innerHTML += `Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})\n`;
        
        // Create a group to hold the model
        const group = new THREE.Group();
        
        // Remove model from scene
        scene.remove(model);
        
        // Reset model position
        model.position.set(0, 0, 0);
        
        // Add model to group
        group.add(model);
        
        // Position model within group to center it
        model.position.set(-center.x, -center.y, -center.z);
        
        // Scale the group - use a larger scale factor to make the model more visible
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // If the model is very small, use a much larger scale
        let scaleFactor = parseFloat(scaleSlider.value);
        if (maxDim < 0.1) {
            scaleFactor *= 50; // Boost small models even more
            debugOutput.innerHTML += `Very small model detected, boosting scale significantly\n`;
        }
        
        const scale = 2 / maxDim * scaleFactor;
        group.scale.set(scale, scale, scale);
        
        // Add group to scene
        scene.add(group);
        
        // Update model reference to the group
        model = group;
        
        // Make sure all materials are visible
        model.traverse((child) => {
            if (child.isMesh) {
                // Ensure the mesh is visible
                child.visible = true;
                
                // Fix materials
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.side = THREE.DoubleSide;
                            mat.transparent = false;
                            mat.opacity = 1.0;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.side = THREE.DoubleSide;
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
        
        // Add box helper
        const boxHelper = new THREE.BoxHelper(model, 0x00ff00);
        scene.add(boxHelper);
        
        debugOutput.innerHTML += `Applied scale: ${scale.toFixed(3)}\n`;
        debugOutput.innerHTML += `Model positioned and scaled successfully\n`;
    }
}

function handleScaleChange() {
    scaleValue.textContent = scaleSlider.value;
    if (model) {
        // Find real meshes again
        const realMeshes = [];
        model.traverse((child) => {
            if (child.isMesh && 
                child.geometry && 
                child.geometry.attributes && 
                child.geometry.attributes.position && 
                child.geometry.attributes.position.count > 0) {
                realMeshes.push(child);
            }
        });
        
        centerAndScaleModel(realMeshes);
    }
}

function updateCameraPosition() {
    if (cameraDistanceSlider) {
        cameraDistance = parseFloat(cameraDistanceSlider.value);
        document.getElementById('cameraDistanceValue').textContent = cameraDistance.toFixed(1);
    }
    
    const phi = THREE.MathUtils.degToRad(90 - verticalAngle);
    const theta = THREE.MathUtils.degToRad(initialAngle);
    
    camera.position.x = cameraDistance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = cameraDistance * Math.cos(phi);
    camera.position.z = cameraDistance * Math.sin(phi) * Math.sin(theta);
    
    camera.lookAt(0, 0, 0);
    
    if (controls) controls.update();
    if (renderer && scene) renderer.render(scene, camera);
}

function updateInitialAngle() {
    initialAngle = parseInt(initialAngleSlider.value);
    document.getElementById('initialAngleValue').textContent = initialAngle;
    updateCameraPosition();
}

function updateVerticalAngle() {
    verticalAngle = parseInt(verticalAngleSlider.value);
    document.getElementById('verticalAngleValue').textContent = verticalAngle;
    updateCameraPosition();
}

// Sprite generation and animation functions
function handleGenerateSprite() {
    if (!model) {
        showStatus('Please load a 3D model first', true);
        return;
    }
    
    try {
        showStatus('Generating sprite sheet...', false);
        generateBtn.disabled = true;
        
        const resolution = parseInt(resolutionSelect.value);
        const steps = parseInt(stepsInput.value);
        
        // Hide helpers for sprite generation
        const gridVisible = gridHelper.visible;
        gridHelper.visible = false;
        axesHelper.visible = false;
        
        // Hide box helpers
        scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                child.visible = false;
            }
        });
        
        generateSpriteSheet(scene, camera, model, resolution, steps, initialAngle, verticalAngle, cameraDistance, frameFillPercentage)
            .then(result => {
                frames = result.frames;
                
                outputCanvas.width = result.spriteSheet.width;
                outputCanvas.height = result.spriteSheet.height;
                const ctx = outputCanvas.getContext('2d');
                ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                ctx.drawImage(result.spriteSheet, 0, 0);
                
                downloadBtn.disabled = false;
                
                if (frames.length > 0) {
                    showFramePreview(0);
                }
                
                showStatus('Sprite sheet generated successfully!', false);
            })
            .catch(error => {
                showStatus(`Error generating sprite sheet: ${error.message}`, true);
                console.error(error);
            })
            .finally(() => {
                // Restore visibility
                gridHelper.visible = gridVisible;
                axesHelper.visible = true;
                
                scene.children.forEach(child => {
                    if (child instanceof THREE.BoxHelper) {
                        child.visible = true;
                    }
                });
                
                generateBtn.disabled = false;
            });
    } catch (error) {
        showStatus(`Error: ${error.message}`, true);
        console.error(error);
        generateBtn.disabled = false;
    }
}

function showFramePreview(frameIndex) {
    if (!frames.length) return;
    
    currentFrame = frameIndex;
    const ctx = spritePreview.getContext('2d');
    ctx.clearRect(0, 0, spritePreview.width, spritePreview.height);
    
    spritePreview.width = frames[frameIndex].width;
    spritePreview.height = frames[frameIndex].height;
    
    ctx.drawImage(frames[frameIndex], 0, 0);
}

function handlePrevFrame() {
    if (!frames.length) return;
    stopPlayback();
    currentFrame = (currentFrame - 1 + frames.length) % frames.length;
    showFramePreview(currentFrame);
}

function handleNextFrame() {
    if (!frames.length) return;
    stopPlayback();
    currentFrame = (currentFrame + 1) % frames.length;
    showFramePreview(currentFrame);
}

function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    if (!frames.length) return;
    
    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
    
    let lastTime = 0;
    const frameTime = 1000 / 10; // 10 fps
    
    function animate(time) {
        if (time - lastTime > frameTime) {
            lastTime = time;
            currentFrame = (currentFrame + 1) % frames.length;
            showFramePreview(currentFrame);
        }
        animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);
}

function stopPlayback() {
    isPlaying = false;
    playPauseBtn.textContent = 'Play';
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function handleDownloadSprite() {
    try {
        if (outputCanvas.width <= 1 || outputCanvas.height <= 1) {
            showStatus('No sprite sheet to download', true);
            return;
        }
        
        const dataURL = outputCanvas.toDataURL('image/png');
        
        if (dataURL.length <= 22) {
            showStatus('Generated sprite sheet is empty', true);
            return;
        }
        
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'sprite-sheet.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showStatus('Sprite sheet downloaded successfully!', false);
    } catch (error) {
        showStatus(`Download failed: ${error.message}`, true);
        console.error(error);
    }
}

function showStatus(message, isError) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    
    if (isError) {
        statusMessage.classList.add('error');
        console.error(message);
    } else {
        console.log(message);
    }
}
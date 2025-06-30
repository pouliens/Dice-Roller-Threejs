// Global variables
let scene, camera, renderer, dice;
let isRolling = false;
let rollAnimation = null;

// Initialize the app
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera with perspective for mobile
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Create dice
    createDice();
    
    // Add event listeners
    setupEventListeners();
    
    // Start render loop
    animate();
}

// Create the dice geometry and materials
function createDice() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    
    // Create materials for each face with numbers
    const materials = [];
    
    // Numbers for each face (in correct order for a standard die)
    const numbers = ['1', '2', '3', '4', '5', '6'];
    
    for (let i = 0; i < 6; i++) {
        // Create a new canvas for each face
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 256, 256);
        
        // Draw border
        context.strokeStyle = '#000000';
        context.lineWidth = 8;
        context.strokeRect(8, 8, 240, 240);
        
        // Draw number
        context.fillStyle = '#000000';
        context.font = 'bold 120px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(numbers[i], 128, 128);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        materials.push(new THREE.MeshPhongMaterial({ map: texture }));
    }
    
    // Create dice mesh
    dice = new THREE.Mesh(geometry, materials);
    dice.castShadow = true;
    dice.receiveShadow = true;
    dice.position.set(0, 1, 0);
    scene.add(dice);
    
    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x404040,
        transparent: true,
        opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

// Setup event listeners
function setupEventListeners() {
    const rollButton = document.getElementById('roll-button');
    
    // Button click
    rollButton.addEventListener('click', rollDice);
    
    // Touch events for mobile
    rollButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        rollDice();
    });
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// Roll the dice
function rollDice() {
    if (isRolling) return;
    
    isRolling = true;
    document.getElementById('result').textContent = 'Rolling...';
    
    // Choose random final result (1-6)
    const finalResult = Math.floor(Math.random() * 6) + 1;
    
    // Calculate target rotations based on final result
    const targetRotations = getFinalRotation(finalResult);
    
    // Add some extra spins for visual effect
    const extraSpins = Math.floor(Math.random() * 3) + 2; // 2-4 extra spins
    const targetRotationX = targetRotations.x + (Math.PI * 2 * extraSpins);
    const targetRotationY = targetRotations.y + (Math.PI * 2 * extraSpins);
    const targetRotationZ = targetRotations.z + (Math.PI * 2 * extraSpins);
    
    // Animation parameters
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    const startRotationX = dice.rotation.x;
    const startRotationY = dice.rotation.y;
    const startRotationZ = dice.rotation.z;
    
    // Animate the roll
    function animateRoll() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Update rotations
        dice.rotation.x = startRotationX + (targetRotationX - startRotationX) * eased;
        dice.rotation.y = startRotationY + (targetRotationY - startRotationY) * eased;
        dice.rotation.z = startRotationZ + (targetRotationZ - startRotationZ) * eased;
        
        // Add subtle bounce to Y position
        const bounce = Math.sin(progress * Math.PI * 3) * (1 - progress) * 0.2;
        dice.position.y = 1 + bounce;
        
        if (progress < 1) {
            rollAnimation = requestAnimationFrame(animateRoll);
        } else {
            // Animation complete - ensure dice is flat and at correct position
            dice.rotation.x = targetRotations.x;
            dice.rotation.y = targetRotations.y;
            dice.rotation.z = targetRotations.z;
            dice.position.y = 1;
            
            isRolling = false;
            showResult(finalResult);
        }
    }
    
    rollAnimation = requestAnimationFrame(animateRoll);
}

// Get the rotation needed for a specific face to be on top
function getFinalRotation(result) {
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // Our numbers array order: ['1', '2', '3', '4', '5', '6']
    // Testing correct mappings:
    const rotations = {
        1: { x: 0, y: 0, z: Math.PI / 2 },          // Face 1 (index 0) - +X face
        2: { x: 0, y: 0, z: -Math.PI / 2 },         // Face 2 (index 1) - -X face
        3: { x: 0, y: 0, z: 0 },                    // Face 3 (index 2) - +Y face (top)
        4: { x: Math.PI, y: 0, z: 0 },              // Face 4 (index 3) - -Y face (bottom)
        5: { x: -Math.PI / 2, y: 0, z: 0 },         // Face 5 (index 4) - +Z face (front)
        6: { x: Math.PI / 2, y: 0, z: 0 }           // Face 6 (index 5) - -Z face (back)
    };
    return rotations[result];
}

// Show the result
function showResult(result) {
    document.getElementById('result').textContent = `You rolled: ${result}`;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    renderer.render(scene, camera);
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
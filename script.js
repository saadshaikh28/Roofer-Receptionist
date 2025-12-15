/**
 * ROOFING CALCULATOR PRO
 * - GSAP Animations
 * - 3D Background (Three.js)
 * - Multi-step Logic
 */

// --- CONFIGURATION ---


const PHONE_NUMBER = "9987412299";

// State Object
let state = {
    step: 1,
    zipcode: '',
    relation: '',
    type: '',
    age: '',
    stories: '',
    size: '',
    situation: '',
    duration: ''
};

// --- DOM ELEMENTS ---
const progressBar = document.getElementById('progressBar');
const dots = document.querySelectorAll('.step-dot');
const steps = document.querySelectorAll('.wizard-step');
const floatingCTA = document.getElementById('floatingCTA'); // Kept ref just in case, though removed from HTML

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initGSAP();
    initEventListeners();
    updateUI();
});

// --- 3D BACKGROUND (Three.js) ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create a mesh (Icosahedron for geometric look)
    const geometry = new THREE.IcosahedronGeometry(10, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0x1E293B,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xF59E0B,
        transparent: true,
        opacity: 0.5
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 15;

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.001;
        sphere.rotation.y += 0.001;
        particlesMesh.rotation.y -= 0.0005;

        sphere.position.y = Math.sin(Date.now() * 0.0005) * 1;

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- GSAP ANIMATIONS ---
function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Text Animation
    const tl = gsap.timeline();
    tl.from(".hero-title .line", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out"
    })
        .from(".subtitle", {
            y: 20,
            opacity: 0,
            duration: 0.8
        }, "-=0.5")
        .from(".calculator-card", {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.7)"
        }, "-=0.3");
}

// --- WIZARD LOGIC ---
function initEventListeners() {

    // Generic Card Selection (Delegation or specific selection)
    const options = document.querySelectorAll('.shape-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const group = opt.dataset.group;
            const value = opt.dataset.value;

            // Update State
            state[group] = value;

            // UI Update: Deselect all in this group, Select clicked
            document.querySelectorAll(`.shape-option[data-group="${group}"]`).forEach(o => {
                o.classList.remove('selected');
            });
            opt.classList.add('selected');

            // Animation
            gsap.fromTo(opt, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
        });
    });

    // Zipcode Input
    const zipInput = document.getElementById('zipcode');
    if (zipInput) {
        zipInput.addEventListener('input', (e) => state.zipcode = e.target.value);
    }

    // --- SLIDERS ---

    // Age Slider
    const ageSlider = document.getElementById('ageSlider');
    const ageDisplay = document.getElementById('ageDisplay');

    if (ageSlider) {
        state.age = "Less than 1 Year"; // Init
        ageSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            let label = "";
            if (val === 0) label = "Less than 1 Year";
            else if (val === 10) label = "10+ Years";
            else label = `${val} Years`;

            state.age = label;
            ageDisplay.innerText = label;
        });
    }

    // Stories Slider
    const storiesSlider = document.getElementById('storiesSlider');
    const storiesDisplay = document.getElementById('storiesDisplay');

    if (storiesSlider) {
        state.stories = "1 Story"; // Init
        storiesSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            const label = val === '3' ? "3+ Stories" : `${val} Story${val > 1 ? 'ies' : ''}`; // Corrected pluralization
            state.stories = label;
            storiesDisplay.innerText = label;
        });
    }

    // Duration Slider
    const durationSlider = document.getElementById('durationSlider');
    const durationDisplay = document.getElementById('durationDisplay');
    const durationLabels = ["Just noticed", "Less than 1 month", "1–6 months", "More than 6 months"];

    if (durationSlider) {
        state.duration = durationLabels[0]; // Init
        durationSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const label = durationLabels[val];
            state.duration = label;
            durationDisplay.innerText = label;
        });
    }


    // Navigation Buttons
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => nextStep());
    });

    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => prevStep());
    });
}

function nextStep() {
    if (validateStep(state.step)) {
        if (state.step < 4) {
            state.step++;
            updateUI();
        }
        if (state.step === 4) {
            calculateFinal();
        }
    } else {
        // Shake animation for error
        gsap.to(`.wizard-step[data-step="${state.step}"]`, { x: 10, duration: 0.1, yoyo: true, repeat: 5 });

        // Highlight missing fields
        highlightMissingFields(state.step);
    }
}

function prevStep() {
    if (state.step > 1) {
        state.step--;
        updateUI();
    }
}

function validateStep(step) {
    if (step === 1) {
        // Zipcode & Relation
        return state.zipcode.length >= 5 && state.relation !== '';
    }
    if (step === 2) {
        // Type, Age, Stories, Size
        return state.type !== '' && state.age !== '' && state.stories !== '' && state.size !== '';
    }
    if (step === 3) {
        // Situation, Duration
        return state.situation !== '' && state.duration !== '';
    }
    return true;
}

function highlightMissingFields(step) {
    // Helper to find groups that are empty in the current step and shake them
    if (step === 1) {
        if (state.zipcode.length < 5) gsap.to('#zipcode', { borderColor: "red", duration: 0.2, yoyo: true, repeat: 3, onComplete: () => { document.getElementById('zipcode').style.borderColor = ""; } });
        if (state.relation === '') gsap.to('.shape-option[data-group="relation"]', { borderColor: "red", duration: 0.2, yoyo: true, repeat: 1, clearProps: "borderColor" });
    }
    if (step === 2) {
        ['type', 'size'].forEach(group => {
            if (state[group] === '') {
                // ideally target the container of the group but targeting options works to show effect
                gsap.to(`.shape-option[data-group="${group}"]`, { borderColor: "red", duration: 0.2, yoyo: true, repeat: 1, clearProps: "borderColor" });
            }
        });
    }
    if (step === 3) {
        ['situation'].forEach(group => {
            if (state[group] === '') {
                gsap.to(`.shape-option[data-group="${group}"]`, { borderColor: "red", duration: 0.2, yoyo: true, repeat: 1, clearProps: "borderColor" });
            }
        });
    }
}


function updateUI() {
    // 1. Update Progress Bar
    const progress = ((state.step - 1) / 3) * 100; // 4 steps total (3 questions + 1 result), so fraction of 3 intervals
    if (progressBar) progressBar.style.width = `${progress}%`;

    // 2. Update Dots
    dots.forEach((dot, idx) => {
        const stepNum = idx + 1;
        dot.classList.remove('active', 'completed');

        if (stepNum === state.step) {
            dot.classList.add('active');
        } else if (stepNum < state.step) {
            dot.classList.add('completed');
        }
    });

    // 3. Show Active Step
    steps.forEach(s => {
        s.classList.remove('active');
        if (parseInt(s.dataset.step) === state.step) {
            s.classList.add('active');
            gsap.fromTo(s,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, clearProps: "all" }
            );
        }
    });
}

// --- CALCULATION LOGIC ---
function calculateFinal() {
    prepareContactLinks();
}

function prepareContactLinks() {
    const message = `Hello, I'd like to reach out regarding my roof.
    
Property Details:
- Zip: ${state.zipcode}
- Relation: ${state.relation}
- Type: ${state.type}
- Age: ${state.age}
- Stories: ${state.stories}
- Size: ${state.size}
- Problem: ${state.situation}
- Duration: ${state.duration}

Please contact me to discuss next steps.`;

    const encoded = encodeURIComponent(message);
    const waBtn = document.getElementById('waBtn');
    const emailBtn = document.getElementById('emailBtn');
    const smsBtn = document.getElementById('smsBtn');

    if (waBtn) waBtn.href = `https://wa.me/${PHONE_NUMBER}?text=${encoded}`;
    if (smsBtn) smsBtn.href = `sms:${PHONE_NUMBER}?&body=${encoded}`;
    if (emailBtn) emailBtn.href = `mailto:?subject=Roofing Inquiry&body=${encoded}`;
}

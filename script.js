/**
 * ROOFING CALCULATOR PRO
 * - GSAP Animations
 * - 3D Background (Three.js)
 * - Multi-step Logic
 */

// --- CONFIGURATION ---

let rooferConfig = {
    name: "Roofer",
    phoneNumber: "9987412299", // Default fallback
    whatsappNumber: "9987412299", // Default fallback
    email: ""
};

// State Object
let state = {
    step: 1,
    location: null, // Lat/Lng object
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadRooferConfig();
    initThreeJS();
    initGSAP();
    initEventListeners();
    initMap();
    updateUI();
});

function loadRooferConfig() {
    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Check for manual override in URL: ?config=name
    let clientName = urlParams.get('config');

    // 2. Local Environment Check (localhost, 127.0.0.1, or no dots in hostname)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.includes('.');

    // 3. Subdomain Detection (only if not local and no manual override)
    if (!clientName && !isLocal) {
        const parts = hostname.split('.');
        if (parts.length > 2) {
            clientName = parts[0];
        }
    }

    // Default to 'roofer_config' for local development or if no client detected
    if (!clientName || isLocal) {
        clientName = clientName || 'roofer_config';
    }

    const configFile = `configs/${clientName}.json`;
    console.log(`%c[Config Debug] Hostname: ${hostname}`, "color: #3b82f6; font-weight: bold;");
    console.log(`%c[Config Debug] Client Name: ${clientName}`, "color: #3b82f6; font-weight: bold;");
    console.log(`%c[Config Debug] Attempting to load: ${configFile}`, "color: #3b82f6; font-weight: bold;");

    if (window.location.protocol === 'file:') {
        console.warn("%c[Config Warning] You are opening this file directly (file://). Browsers like Chrome block 'fetch' calls for local files. Please use a local server (e.g., VS Code Live Server or 'npx serve') to test JSON configurations.", "color: #f59e0b; font-weight: bold;");
        return; // Stop here as fetch will fail
    }

    fetch(configFile)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(config => {
            rooferConfig = { ...rooferConfig, ...config };
            console.log("%c[Config Success] Roofer config merged:", "color: #10b981; font-weight: bold;", rooferConfig);

            // Personalization
            const heroTitle = document.querySelector('.hero-title');
            const ogTitle = document.getElementById('ogTitle');
            const twitterTitle = document.getElementById('twitterTitle');
            const displayName = rooferConfig.companyName || rooferConfig.name || "Roofer";

            if (rooferConfig.companyName) {
                const fullTitle = `${rooferConfig.companyName} - Roofing Estimate`;
                document.title = fullTitle;
                if (ogTitle) ogTitle.setAttribute('content', fullTitle);
                if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

                heroTitle.innerHTML = `
                    <span class="line">Roofing Cost Estimate</span>
                    <span class="line brand-line">by <span class="company-brand">${rooferConfig.companyName}</span></span>
                `;
            } else {
                const defaultTitle = "Roofing Cost Estimate";
                document.title = defaultTitle;
                if (ogTitle) ogTitle.setAttribute('content', defaultTitle);
                if (twitterTitle) twitterTitle.setAttribute('content', defaultTitle);

                heroTitle.innerHTML = `<span class="line">Roofing Cost Estimate</span>`;
            }
        })
        .catch(error => {
            console.error(`%c[Config Error] Failed to load ${configFile}:`, "color: #ef4444; font-weight: bold;", error);

            // Fallback to the default roofer_config.json if a specific one fails
            if (clientName !== 'roofer_config') {
                console.log("%c[Config Info] Falling back to default configs/roofer_config.json", "color: #3b82f6;");
                fetch('configs/roofer_config.json')
                    .then(res => res.json())
                    .then(data => {
                        rooferConfig = { ...rooferConfig, ...data };
                    })
                    .catch(err => console.error("Critical: Could not load fallback config", err));
            }
        });
}

// --- 3D BACKGROUND (Three.js) ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFACC15,
        wireframe: true,
        transparent: true,
        opacity: 0.05
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
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
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

// --- MAP INTEGRATION ---
let map, marker;

async function locateUserByIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP detection failed');
        const data = await response.json();
        return { lat: data.latitude, lng: data.longitude, zoom: 11 };
    } catch (error) {
        console.warn("Geolocation Error: Falling back to world view.", error);
        return { lat: 20, lng: 0, zoom: 2 }; // World view fallback
    }
}

async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Get initial view based on IP or fallback
    const initialView = await locateUserByIP();
    map = L.map('map').setView([initialView.lat, initialView.lng], initialView.zoom);

    // CartoDB Voyager tiles (clear, light, and high contrast)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Click handler
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        state.location = { lat: lat.toFixed(6), lng: lng.toFixed(6) };

        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="color: #ef4444; filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));">
                             <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none">
                               <line x1="18" y1="6" x2="6" y2="18"></line>
                               <line x1="6" y1="6" x2="18" y2="18"></line>
                             </svg>
                           </div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(map);
        }

        // Visual Confirmation (Much more intense green glow)
        gsap.fromTo("#map-container",
            { borderColor: "#22c55e", boxShadow: "0 0 40px rgba(34, 197, 94, 1)", borderWidth: "4px" },
            { borderColor: "rgba(255, 255, 255, 0.15)", boxShadow: "0 0 0px rgba(34, 197, 94, 0)", borderWidth: "2px", duration: 1.5, ease: "power2.out" }
        );

        // Auto-advance if relation is also selected
        if (state.relation) {
            setTimeout(() => {
                if (state.step === 1 && state.location && state.relation) {
                    nextStep();
                }
            }, 1000);
        }
    });

    window.addEventListener('resize', () => map.invalidateSize());
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


    // --- SLIDERS ---
    function updateSliderFill(slider) {
        const min = slider.min || 0;
        const max = slider.max || 100;
        const val = slider.value;
        const percent = (val - min) * 100 / (max - min);
        slider.style.setProperty('--range-percent', percent + '%');

        // Move glitter position based on value (10px per unit)
        slider.style.setProperty('--glitter-pos', (val * 10) + 'px');
    }

    // Age Slider
    const ageSlider = document.getElementById('ageSlider');
    const ageDisplay = document.getElementById('ageDisplay');

    if (ageSlider) {
        state.age = "Less than 1 Year"; // Init
        ageSlider.classList.add('glitter-slider');
        updateSliderFill(ageSlider);
        ageSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            let label = "";
            if (val === 0) label = "Less than 1 Year";
            else if (val === 10) label = "10+ Years";
            else label = `${val} Years`;

            state.age = label;
            ageDisplay.innerText = label;
            updateSliderFill(e.target);
        });
    }

    // Stories Slider
    const storiesSlider = document.getElementById('storiesSlider');
    const storiesDisplay = document.getElementById('storiesDisplay');

    if (storiesSlider) {
        state.stories = "1 Story"; // Init
        storiesSlider.classList.add('glitter-slider');
        updateSliderFill(storiesSlider);
        storiesSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            const label = val === '3' ? "3+ Stories" : `${val} Story${val > 1 ? 'ies' : ''}`; // Corrected pluralization
            state.stories = label;
            storiesDisplay.innerText = label;
            updateSliderFill(e.target);
        });
    }

    // Duration Slider
    const durationSlider = document.getElementById('durationSlider');
    const durationDisplay = document.getElementById('durationDisplay');
    const durationLabels = ["Just noticed", "Less than 1 month", "1–6 months", "More than 6 months"];

    if (durationSlider) {
        state.duration = durationLabels[0]; // Init
        durationSlider.classList.add('glitter-slider');
        updateSliderFill(durationSlider);
        durationSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const label = durationLabels[val];
            state.duration = label;
            durationDisplay.innerText = label;
            updateSliderFill(e.target);
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
        // Relation & Location
        return state.relation !== '' && state.location !== null;
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
        if (state.location === null) {
            gsap.fromTo('#map-container',
                { borderColor: "#ef4444", boxShadow: "0 0 25px rgba(239, 68, 68, 0.7)", x: -10 },
                { borderColor: "rgba(255, 255, 255, 0.15)", boxShadow: "0 0 0px rgba(0,0,0,0)", x: 0, duration: 0.1, repeat: 5, yoyo: true, clearProps: "x" }
            );
        }
        if (state.relation === '') gsap.to('.shape-option[data-group="relation"]', { borderColor: "#ef4444", duration: 0.2, yoyo: true, repeat: 1, clearProps: "borderColor" });
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

            // Fix for Leaflet map grey tiles when Step 1 is active
            if (parseInt(s.dataset.step) === 1 && map) {
                setTimeout(() => map.invalidateSize(), 150);
            }
        }
    });
}

// --- CALCULATION LOGIC ---
function calculateFinal() {
    prepareContactLinks();
}

function prepareContactLinks() {
    const message = `Hello ${rooferConfig.name}, I'd like to reach out regarding my roof.
    
Details:
- Location: ${state.location ? `https://www.google.com/maps?q=${state.location.lat},${state.location.lng}` : 'Not pinned'}
- Property: ${state.relation}
- Roof Type: ${state.type}
- RoofAge: ${state.age}
- Number of Stories: ${state.stories}
- Roof Size: ${state.size}
- Problem: ${state.situation}
- Duration: ${state.duration}

Please contact me to discuss next steps.`;

    const encoded = encodeURIComponent(message);
    const waBtn = document.getElementById('waBtn');
    const emailBtn = document.getElementById('emailBtn');
    const smsBtn = document.getElementById('smsBtn');

    // 1. WhatsApp Button
    if (waBtn) {
        if (rooferConfig.whatsappNumber) {
            waBtn.href = `https://wa.me/${rooferConfig.whatsappNumber}?text=${encoded}`;
            waBtn.style.display = 'flex';
        } else {
            waBtn.style.display = 'none';
        }
    }

    // 2. SMS Button
    if (smsBtn) {
        if (rooferConfig.phoneNumber) {
            smsBtn.href = `sms:${rooferConfig.phoneNumber}?&body=${encoded}`;
            smsBtn.style.display = 'flex';
        } else {
            smsBtn.style.display = 'none';
        }
    }

    // 3. Email Button
    if (emailBtn) {
        if (rooferConfig.email) {
            emailBtn.href = `mailto:${rooferConfig.email}?subject=Roofing Inquiry&body=${encoded}`;
            emailBtn.style.display = 'flex';
        } else {
            emailBtn.style.display = 'none';
        }
    }
}

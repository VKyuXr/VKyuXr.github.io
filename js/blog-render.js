if (typeof THREE === 'undefined') {
    alert("Three.js 加载失败，请刷新");
}

const cardsTransition = {
    targetOpacity: 1,
    currentOpacity: 1,
    targetVisible: true,
    transitionSpeed: 30
};

const particleState = {
    isRising: false,
    riseTimer: null,
    riseDuration: 2500,
    transitionDelay: 300
};

function triggerParticleRise() {
    if (particleState.riseTimer) {
        clearTimeout(particleState.riseTimer);
    }
    
    particleState.isRising = true;
    console.log('🌊 粒子上升动画触发');
    
    particleState.riseTimer = setTimeout(() => {
        particleState.isRising = false;
        console.log('🌀 粒子恢复旋转模式');
    }, particleState.riseDuration);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08081a);
scene.fog = new THREE.FogExp2(0x08081a, 0.012);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 3, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x40406b);
scene.add(ambientLight);
const pointLight1 = new THREE.PointLight(0x6a4eff, 1.8, 40);
pointLight1.position.set(6, 8, 8);
scene.add(pointLight1);
const pointLight2 = new THREE.PointLight(0xff4da6, 1.2, 30);
pointLight2.position.set(-7, 3, 10);
scene.add(pointLight2);
const backLight = new THREE.PointLight(0x3a2f8a, 1.0);
backLight.position.set(0, 0, -15);
scene.add(backLight);

function createParticleSystem() {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
        const r = 7 + Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
        const z = r * Math.cos(phi);
        
        positions[i*3] = x;
        positions[i*3+1] = y * 1.1;
        positions[i*3+2] = z;
        
        velocities[i] = 0.02 + Math.random() * 0.06;
        
        const hue = 0.65 + (y / 18) * 0.3 + Math.random() * 0.1;
        const saturation = 0.6 + Math.random() * 0.4;
        const lightness = 0.5 + Math.random() * 0.4;
        color.setHSL(hue, saturation, lightness);
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(200,200,255,0.9)';
    ctx.beginPath(); ctx.arc(16, 16, 8, 0, Math.PI*2); ctx.fill();
    const particleTexture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
        size: 0.22,
        map: particleTexture,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        sizeAttenuation: true
    });
    
    const points = new THREE.Points(geo, mat);
    points.userData = {
        upperBound: 15,
        lowerBound: -15,
        horizontalRange: 20
    };
    return points;
}
const particleSystem = createParticleSystem();
scene.add(particleSystem);

function updateParticlesUpward(points, isRising, delta, elapsedTime) {
    if (!points || !points.geometry) return;
    
    const positions = points.geometry.attributes.position;
    const velocities = points.geometry.attributes.velocity;
    const bounds = points.userData || { 
        upperBound: 15, 
        lowerBound: -15, 
        horizontalRange: 20 
    };
    
    const speedMultiplier = isRising ? 1.0 : 0.05;
    
    for (let i = 0; i < positions.count; i++) {
        const idx = i * 3;
        
        positions.array[idx + 1] += velocities.array[i] * speedMultiplier;
        
        if (positions.array[idx + 1] > bounds.upperBound) {
            positions.array[idx + 1] = bounds.lowerBound;
            // if (isRising) {
            //     positions.array[idx] += (Math.random() - 0.5) * 0.3;
            //     positions.array[idx + 2] += (Math.random() - 0.5) * 0.3;
            // }
        }
        
        // if (isRising) {
        //     positions.array[idx] += Math.sin(elapsedTime * 0.5 + i * 0.1) * 0.003;
        //     positions.array[idx + 2] += Math.cos(elapsedTime * 0.3 + i * 0.1) * 0.003;
        // }
    }
    
    positions.needsUpdate = true;
}

function createBackgroundParticles() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        const r = 20 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
        positions[i*3+2] = r * Math.cos(phi);
        
        // 背景粒子速度稍慢
        velocities[i] = 0.01 + Math.random() * 0.03;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    
    const mat = new THREE.PointsMaterial({
        size: 0.12,
        color: 0x99aaff,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    });
    
    const points = new THREE.Points(geo, mat);
    points.userData = {
        upperBound: 25,
        lowerBound: -25,
        horizontalRange: 40
    };
    return points;
}
const bgParticles = createBackgroundParticles();
scene.add(bgParticles);

const loader = new THREE.GLTFLoader();
let HofmannKnot = null;
loader.load(
  'asset/HofmannKnot.glb',
  (gltf) => {
    HofmannKnot = gltf.scene;
    HofmannKnot.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x333333,
          wireframe: true,
          metalness: 0.3,
          roughness: 0.5
        });
      }
    });
    HofmannKnot.scale.set(2, 2, 2);
    HofmannKnot.position.set(0, 1, 0);
    HofmannKnot.rotation.y = Math.PI / 4;
    scene.add(HofmannKnot);
    console.log('✨ 金色绳结加载成功！');
  },
  (xhr) => {
    console.log(`加载进度 ${(xhr.loaded / xhr.total * 100)}%`);
  },
  (error) => {
    console.error('模型加载失败', error);
  }
);

const orbitSpheres = []; 
const sphereGeo = new THREE.SphereGeometry(0.18, 10, 10);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x9f8eff, emissive: 0x332570 });
for (let i = 0; i < 10; i++) {
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    const angle = (i / 10) * Math.PI * 2;
    const radius = 2.8;
    sphere.position.set(Math.cos(angle) * radius, 0.5 + Math.sin(angle*2)*0.4, Math.sin(angle) * radius);
    scene.add(sphere);
    orbitSpheres.push(sphere); 
}

function createRoundedCard(width, height, depth, radius, color) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);
    const extrudeSettings = { depth: depth, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhysicalMaterial({
        color: color, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.85,
        emissive: color, emissiveIntensity: 0.7, clearcoat: 1.0, clearcoatRoughness: 0.2, side: THREE.DoubleSide
    });
    return new THREE.Mesh(geometry, material);
}

const cardsGroup = new THREE.Group();
const cardMeshes = [];

const colorPalette = [
    0x6a4eff,
    0xff4da6,
    0x4facfe,
    0xa18eff,
    0xffaa66,
    0x00f2ff
];

async function init3DCards() {
    let posts = window.blogPostsData;

    if (!posts || posts.length === 0) {
        console.log("⏳ 等待博客数据加载...");
        await new Promise((resolve) => {
            window.addEventListener('blog-data-ready', (e) => {
                posts = e.detail;
                resolve();
            }, { once: true });
            
            setTimeout(() => {
                if (!posts) posts = window.blogPostsData || [];
                resolve();
            }, 1000);
        });
    }

    if (!posts || posts.length === 0) {
        console.warn("⚠️ 未找到任何文章数据，跳过 3D 卡片生成。");
        return;
    }

    console.log(`🚀 开始生成 ${posts.length} 个 3D 文章卡片...`);

    posts.forEach((post, index) => {
        const color = colorPalette[index % colorPalette.length];

        const card = createRoundedCard(4.0, 2.0, 0.1, 0.2, color);

        const angle = (index / posts.length) * Math.PI * 2;
        const radius = 5.5;
        
        card.position.x = Math.cos(angle) * radius;
        card.position.z = Math.sin(angle) * radius;
        card.position.y = Math.sin(angle * 2) * 1.2; 

        card.lookAt(0, 0.5, 0);
        card.rotateY(0.2);

        card.userData = { 
            isCard: true, 
            ...post, 
            originalColor: color 
        };

        cardsGroup.add(card);
        cardMeshes.push(card);
    });

    scene.add(cardsGroup);
    console.log("✅ 3D 卡片场景构建完成");
}

init3DCards();

let controls;
if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.target.set(0, 0.8, 0);
} else {
    controls = { update: () => {}, autoRotate: false };
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCard = null;

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    if (event.target.closest('#article-modal') || event.target.closest('.blog-list-view')) return;

    if (!cardsGroup.visible) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cardMeshes);

    if (intersects.length > 0) {
        const card = intersects[0].object;
        openArticle(card.userData);
    }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const modal = document.getElementById('article-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');

window.closeArticle = function() {
    modal.classList.remove('active');
    if (controls && cardsGroup.visible) {
        controls.autoRotate = true;
    }
};

const blogListView = document.getElementById('blogListView');
const globalNav = document.getElementById('globalNav');
const navBackTo3D = document.getElementById('navBackTo3D');
let isBlogViewActive = false;

function showBlogView() {
    if (isBlogViewActive) return;
    isBlogViewActive = true;
    
    cardsTransition.targetOpacity = 0;
    cardsTransition.targetVisible = false;
    
    blogListView.classList.add('active');
    document.body.style.overflow = 'auto';
    if (controls) controls.autoRotate = false;
    globalNav.classList.add('blog-mode');
}

function show3DView() {
    if (!isBlogViewActive) return;
    isBlogViewActive = false;
    
    cardsTransition.targetOpacity = 1;
    cardsTransition.targetVisible = true;
    cardsGroup.visible = true;
    
    blogListView.classList.remove('active');
    document.body.style.overflow = 'hidden';
    if (controls) controls.autoRotate = true;
    globalNav.classList.remove('blog-mode');
}

let isScrolling = false;
window.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    isScrolling = true;
    setTimeout(() => isScrolling = false, 300);

    const deltaY = e.deltaY;

    if (!isBlogViewActive && deltaY > 0) {
        showBlogView();
        triggerParticleRise();
        
    } else if (isBlogViewActive && deltaY < 0) {
        const container = blogListView;
        if (container.scrollTop <= 0) {
            show3DView();
        }
    }
}, { passive: true });

navBackTo3D.addEventListener('click', (e) => {
    e.preventDefault();
    if (isBlogViewActive) {
        show3DView();
    }
});

const blogCards = document.querySelectorAll('.blog-card');
blogCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const title = card.dataset.title || '文章';
        const content = card.dataset.content || '暂无内容';
        modalTitle.innerText = title;
        modalContent.innerText = content;
        modal.classList.add('active');
        if (controls) controls.autoRotate = false;
    });
});

const originalClose = window.closeArticle;
window.closeArticle = function() {
    modal.classList.remove('active');
    if (controls && !isBlogViewActive) {
        controls.autoRotate = true;
    }
};

document.body.style.overflow = 'hidden';
show3DView();

document.querySelectorAll('.nav-menu a:not(#navBackTo3D)').forEach(link => {
    link.addEventListener('click', (e) => e.preventDefault());
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsedTime = performance.now() / 1000;

    if (controls) controls.update();

    if (Math.abs(cardsTransition.currentOpacity - cardsTransition.targetOpacity) > 0.001) {
        const t = Math.min(1, cardsTransition.transitionSpeed * delta);
        const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        
        cardsTransition.currentOpacity += 
            (cardsTransition.targetOpacity - cardsTransition.currentOpacity) * easedT;
        
        cardMeshes.forEach(card => {
            if (card.material) {
                card.material.opacity = cardsTransition.currentOpacity;
                card.material.emissiveIntensity = 0.7 * cardsTransition.currentOpacity;
            }
        });
    }
    
    if (cardsTransition.targetVisible === false && cardsTransition.currentOpacity < 0.05) {
        cardsGroup.visible = false;
    } else if (cardsTransition.targetVisible === true && cardsTransition.currentOpacity > 0.95) {
        cardsGroup.visible = true;
    }

    if (particleState.isRising) {
        updateParticlesUpward(particleSystem, true, delta, elapsedTime);
        updateParticlesUpward(bgParticles, true, delta, elapsedTime);
        
        particleSystem.rotation.y = 0;
        particleSystem.rotation.x = 0;
        bgParticles.rotation.y = 0;
        
    } else {
        particleSystem.rotation.y += 0.00015;
        particleSystem.rotation.x += 0.00005;
        bgParticles.rotation.y -= 0.0001;
    }

    if (HofmannKnot) {
        HofmannKnot.rotation.x += 0.001;
        HofmannKnot.rotation.y += 0.002;
    }

    orbitSpheres.forEach((sphere, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const baseY = 0.5 + Math.sin(angle*2)*0.4;
        const floatOffset = Math.sin(elapsedTime * 2 + i) * 0.2;
        
        sphere.position.y = baseY + Math.sin(elapsedTime * 1.5 + i * 0.5) * 0.1;
    });

    if (cardsGroup.visible && cardsTransition.currentOpacity > 0.05) {
        cardMeshes.forEach((card, i) => {
            card.position.y += Math.sin(elapsedTime * 1.5 + i) * 0.0015;
            card.rotation.z += 0.002;
        });
    }

    if (cardsGroup.visible && cardsTransition.currentOpacity > 0.1) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cardMeshes);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (hoveredCard !== object) {
                if (hoveredCard && hoveredCard.material) {
                    hoveredCard.scale.set(1, 1, 1);
                    hoveredCard.material.emissiveIntensity = 0.7 * cardsTransition.currentOpacity;
                }
                hoveredCard = object;
                document.body.style.cursor = 'pointer';
                if (hoveredCard.material) {
                    hoveredCard.scale.set(1.15, 1.15, 1.15);
                    hoveredCard.material.emissiveIntensity = 1.8 * cardsTransition.currentOpacity;
                }
            }
        } else {
            if (hoveredCard && hoveredCard.material) {
                hoveredCard.scale.set(1, 1, 1);
                hoveredCard.material.emissiveIntensity = 0.7 * cardsTransition.currentOpacity;
                hoveredCard = null;
                document.body.style.cursor = 'default';
            }
        }
    } else {
        if (hoveredCard && hoveredCard.material) {
            hoveredCard.scale.set(1, 1, 1);
            hoveredCard.material.emissiveIntensity = 0.7;
            hoveredCard = null;
            document.body.style.cursor = 'default';
        }
    }

    renderer.render(scene, camera);
}

animate();
/**
 * Stackly 3D Interactive Graphics Engine
 * Uses Three.js to render premium, interactive, responsive 3D animations.
 * Implements lazy loading and viewport visibility tracking to optimize performance.
 */

(function () {
  const THREE_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  // 1. Dynamic Script Loader
  function loadScript(url, callback) {
    if (window.THREE) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    script.onerror = () => console.error(`Failed to load script: ${url}`);
    document.head.appendChild(script);
  }

  // 2. Viewport-Based Initialization & Disposal Manager
  const activeScenes = new Map();

  function initEngine() {
    const targets = document.querySelectorAll('.interactive-3d-graphic');
    if (targets.length === 0) return;

    // Set up intersection observer to only render visible canvases
    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.05
    };

    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const container = entry.target;
        const type = container.getAttribute('data-type');
        
        if (entry.isIntersecting) {
          // If not already initialized, create the 3D scene
          if (!activeScenes.has(container)) {
            const sceneInstance = create3DScene(container, type);
            if (sceneInstance) {
              activeScenes.set(container, sceneInstance);
            }
          } else {
            // Resume rendering loop
            const instance = activeScenes.get(container);
            if (instance && !instance.running) {
              instance.running = true;
              instance.animate();
            }
          }
        } else {
          // Pause rendering loop when out of viewport to save CPU/GPU cycles
          const instance = activeScenes.get(container);
          if (instance && instance.running) {
            instance.running = false;
          }
        }
      });
    }, observerOptions);

    targets.forEach(target => sceneObserver.observe(target));
  }

  // Helper: Create general Three.js boilerplate for a container
  function create3DScene(container, type) {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    
    // Transparent or very dark background depending on theme
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = ''; // Clear fallback text/emojis
    container.appendChild(renderer.domElement);

    // Basic Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(isDark ? 0xee5536 : 0xee5536, 0.8); // Primary Accent
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isDark ? 0xe5b10d : 0xe5b10d, 0.6); // Secondary Accent
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    // Mouse Tracking for Interactive Tilt
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / rect.width) * 2 - 1;
      mouse.targetY = -(clientY / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', onMouseMove);

    // Interactive Group to hold all graphic contents for mouse tilt
    const tiltGroup = new THREE.Group();
    scene.add(tiltGroup);

    // Specialized scene setup
    const update = setupSpecificScene(tiltGroup, type, isDark, scene);

    // Render loop wrapper
    const instance = {
      running: true,
      animate: function () {
        if (!instance.running) return;
        requestAnimationFrame(instance.animate);

        // Smooth mouse dampening
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;

        // Apply interactive tilt
        tiltGroup.rotation.y = mouse.x * 0.4;
        tiltGroup.rotation.x = -mouse.y * 0.3;

        // Run type-specific animation updates
        if (update) update(mouse);

        renderer.render(scene, camera);
      },
      resize: function () {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      },
      dispose: function () {
        instance.running = false;
        container.removeEventListener('mousemove', onMouseMove);
        // Recursively dispose geometry/materials
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        renderer.dispose();
      }
    };

    // Resize handler
    window.addEventListener('resize', instance.resize);

    // Run first render
    instance.animate();

    return instance;
  }

  // 3. Specific Scene Content Builders
  function setupSpecificScene(group, type, isDark, mainScene) {
    const primaryColor = isDark ? 0xee5536 : 0xee5536;   // Printo Orange
    const secondaryColor = isDark ? 0xe5b10d : 0xe5b10d; // Printo Gold/Yellow
    const wireMaterial = new THREE.MeshPhongMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const solidMaterial = new THREE.MeshPhongMaterial({
      color: secondaryColor,
      flatShading: true,
      shininess: 80
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 0.5
    });

    let animationCallback = null;

    switch (type) {
      case 'hero-printer': {
        // Build platform base
        const bedGeom = new THREE.BoxGeometry(4.5, 0.1, 4.5);
        const bedMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, transparent: true, opacity: 0.9 });
        const bed = new THREE.Mesh(bedGeom, bedMat);
        bed.position.y = -2;
        group.add(bed);

        // Frame structure
        const frameGeom = new THREE.BoxGeometry(4.6, 3.5, 4.6);
        const edges = new THREE.EdgesGeometry(frameGeom);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 });
        const frame = new THREE.LineSegments(edges, lineMat);
        group.add(frame);

        // Rotating Part being printed
        const gearGeom = new THREE.TorusKnotGeometry(0.8, 0.28, 120, 16);
        const gearWire = new THREE.Mesh(gearGeom, new THREE.MeshPhongMaterial({
          color: primaryColor,
          wireframe: true
        }));
        const gearSolid = new THREE.Mesh(gearGeom, new THREE.MeshPhongMaterial({
          color: secondaryColor,
          transparent: true,
          opacity: 0,
          flatShading: true
        }));
        group.add(gearWire);
        group.add(gearSolid);

        // Print Nozzle Assembly
        const nozzleGroup = new THREE.Group();
        const nozzleHeadGeom = new THREE.ConeGeometry(0.2, 0.5, 4);
        nozzleHeadGeom.rotateX(Math.PI);
        const nozzleMat = new THREE.MeshPhongMaterial({ color: 0xd97706, flatShading: true });
        const nozzleHead = new THREE.Mesh(nozzleHeadGeom, nozzleMat);
        nozzleGroup.add(nozzleHead);

        // Laser Beam
        const laserGeom = new THREE.CylinderGeometry(0.015, 0.015, 3, 4);
        laserGeom.translate(0, -1.5, 0);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.9 });
        const laser = new THREE.Mesh(laserGeom, laserMat);
        nozzleGroup.add(laser);
        group.add(nozzleGroup);

        const colorGreen = new THREE.Color(0x23a455);
        const colorYellow = new THREE.Color(0xe5b10d);
        const colorOrange = new THREE.Color(0xee5536);

        let printProgress = 0;
        let time = 0;

        animationCallback = function () {
          time += 0.02;

          // Smooth color transitions between Green -> Yellow -> Orange -> Green
          const cycle = (time * 0.15) % 3;
          let targetColor = new THREE.Color();
          if (cycle < 1) {
            targetColor.copy(colorGreen).lerp(colorYellow, cycle);
          } else if (cycle < 2) {
            targetColor.copy(colorYellow).lerp(colorOrange, cycle - 1);
          } else {
            targetColor.copy(colorOrange).lerp(colorGreen, cycle - 2);
          }
          gearWire.material.color.copy(targetColor);
          gearSolid.material.color.copy(targetColor);
          
          // Nozzle sweeps in a Lissajous curve
          const nx = Math.sin(time * 2.5) * 1.5;
          const nz = Math.cos(time * 1.8) * 1.5;
          const ny = 0.5 + Math.sin(time * 0.2) * 0.3; // rises slowly
          nozzleGroup.position.set(nx, ny, nz);

          // Update Laser length to reach the printed part
          laser.scale.y = (ny - (-0.5)) / 3;
          laser.position.y = 0;

          // Rotate printed part
          gearWire.rotation.y += 0.005;
          gearSolid.rotation.y += 0.005;

          // Slowly phase solid print in and out to simulate printing cycle
          printProgress += 0.003;
          if (printProgress > Math.PI) printProgress = 0;
          gearSolid.material.opacity = Math.sin(printProgress) * 0.9;
        };
        break;
      }

      case 'about-globe': {
        // Renders global network connectivity
        const globeGeom = new THREE.SphereGeometry(1.8, 20, 20);
        const globeEdges = new THREE.EdgesGeometry(globeGeom);
        const globeLines = new THREE.LineSegments(globeEdges, new THREE.LineBasicMaterial({
          color: secondaryColor,
          transparent: true,
          opacity: 0.35
        }));
        group.add(globeLines);

        const innerGlobe = new THREE.Mesh(
          new THREE.SphereGeometry(1.75, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.7 })
        );
        group.add(innerGlobe);

        // Core central server sphere
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshPhongMaterial({ color: primaryColor, emissive: primaryColor, emissiveIntensity: 0.5 })
        );
        group.add(core);

        // Add orbiting nodes
        const nodesGroup = new THREE.Group();
        group.add(nodesGroup);

        const nodeCount = 10;
        const nodes = [];
        const linesGeom = new THREE.BufferGeometry();
        const linePositions = [];

        for (let i = 0; i < nodeCount; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = 2.0;

          const x = r * Math.sin(phi) * Math.cos(theta);
          const y = r * Math.sin(phi) * Math.sin(theta);
          const z = r * Math.cos(phi);

          const nodeMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: secondaryColor })
          );
          nodeMesh.position.set(x, y, z);
          nodesGroup.add(nodeMesh);
          nodes.push(nodeMesh.position);

          // Connection point to core
          linePositions.push(0, 0, 0);
          linePositions.push(x, y, z);
        }

        // Add connections
        linesGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const networkLines = new THREE.LineSegments(
          linesGeom,
          new THREE.LineBasicMaterial({ color: secondaryColor, transparent: true, opacity: 0.4 })
        );
        nodesGroup.add(networkLines);

        animationCallback = function () {
          globeLines.rotation.y += 0.003;
          globeLines.rotation.x += 0.001;
          nodesGroup.rotation.y -= 0.005;
          nodesGroup.rotation.z += 0.002;
        };
        break;
      }

      case 'service-prototyping': {
        // Interlocking gears
        const buildGear = (teeth, innerRadius, outerRadius, thickness, color) => {
          const gear = new THREE.Group();
          const mat = new THREE.MeshPhongMaterial({ color: color, flatShading: true, shininess: 90 });

          // Central core hub
          const hubGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, thickness, 24);
          hubGeom.rotateX(Math.PI / 2);
          const hub = new THREE.Mesh(hubGeom, mat);
          gear.add(hub);

          // Outer wheel rim
          const rimGeom = new THREE.CylinderGeometry(outerRadius * 0.8, outerRadius * 0.8, thickness, 24);
          rimGeom.rotateX(Math.PI / 2);
          const rim = new THREE.Mesh(rimGeom, mat);
          gear.add(rim);

          // Add teeth
          const toothWidth = (Math.PI * 2 * outerRadius) / teeth * 0.4;
          const toothLength = outerRadius * 0.25;
          const toothGeom = new THREE.BoxGeometry(toothWidth, toothLength, thickness);
          
          for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const tooth = new THREE.Mesh(toothGeom, mat);
            // Position tooth radially
            tooth.position.x = Math.cos(angle) * (outerRadius - toothLength/2);
            tooth.position.y = Math.sin(angle) * (outerRadius - toothLength/2);
            tooth.rotation.z = angle;
            gear.add(tooth);
          }
          return gear;
        };

        const gear1 = buildGear(16, 0.3, 1.5, 0.4, primaryColor);
        gear1.position.x = -1.2;
        group.add(gear1);

        const gear2 = buildGear(10, 0.2, 0.9, 0.4, secondaryColor);
        gear2.position.x = 1.1;
        gear2.rotation.z = Math.PI / 10; // tooth offset fit
        group.add(gear2);

        animationCallback = function () {
          gear1.rotation.z += 0.015;
          gear2.rotation.z -= 0.024; // speeds fit ratios
        };
        break;
      }

      case 'service-batching': {
        // Grid matrix of batch elements
        const rows = 3;
        const cols = 3;
        const gap = 1.1;
        const items = [];

        const geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const mat = new THREE.MeshPhongMaterial({
              color: (r + c) % 2 === 0 ? primaryColor : secondaryColor,
              flatShading: true
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
              (c - (cols - 1) / 2) * gap,
              (r - (rows - 1) / 2) * gap,
              0
            );
            group.add(mesh);
            items.push(mesh);
          }
        }

        let step = 0;
        animationCallback = function () {
          step += 0.03;
          items.forEach((item, idx) => {
            // Hover in sine-wave offset
            item.position.z = Math.sin(step + idx * 0.4) * 0.35;
            item.rotation.x += 0.01 + (idx * 0.002);
            item.rotation.y += 0.015;
          });
        };
        break;
      }

      case 'service-scanning': {
        // Rotating mesh being scanned
        const geom = new THREE.TorusKnotGeometry(1.0, 0.3, 100, 16);
        const wire = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
          color: 0x475569,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        }));
        
        // Cured green/cyan highlight
        const scanHighlight = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
          color: secondaryColor,
          wireframe: true,
          transparent: true,
          opacity: 1
        }));

        group.add(wire);
        group.add(scanHighlight);

        // Horizontal laser grid plane
        const gridGeom = new THREE.PlaneGeometry(3.5, 3.5, 10, 10);
        const gridEdges = new THREE.EdgesGeometry(gridGeom);
        const scanGrid = new THREE.LineSegments(gridEdges, new THREE.LineBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.8
        }));
        scanGrid.rotation.x = Math.PI / 2;
        group.add(scanGrid);

        let scannerY = 0;
        let scanDir = 1;
        animationCallback = function () {
          wire.rotation.y += 0.008;
          scanHighlight.rotation.y += 0.008;

          // Animate scanning plane
          scannerY += 0.02 * scanDir;
          if (Math.abs(scannerY) > 1.6) {
            scanDir *= -1;
          }
          scanGrid.position.y = scannerY;

          // Dynamically scale/hide scanned vertex overlays
          // We simulate a shader by updating the highlight opacity phase
          scanHighlight.position.y = Math.sin(scannerY * 0.2) * 0.05;
        };
        break;
      }

      case 'materials-lattice': {
        // Render detailed molecular crystal lattice
        const balls = new THREE.Group();
        group.add(balls);

        const nodes = [
          [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
          [0, 0, -1.2], [0, 0, 1.2], [0, -1.2, 0], [0, 1.2, 0], [-1.2, 0, 0], [1.2, 0, 0]
        ];

        const nodeSpheres = [];
        nodes.forEach((pos, idx) => {
          const sphereMat = new THREE.MeshPhongMaterial({
            color: idx % 3 === 0 ? primaryColor : (idx % 3 === 1 ? secondaryColor : 0x94a3b8),
            shininess: 100
          });
          const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), sphereMat);
          sphere.position.set(pos[0] * 1.5, pos[1] * 1.5, pos[2] * 1.5);
          balls.add(sphere);
          nodeSpheres.push(sphere.position);
        });

        // Add bonds (connections)
        const linesGeom = new THREE.BufferGeometry();
        const linePositions = [];

        // Connect outer nodes
        for (let i = 0; i < nodeSpheres.length; i++) {
          for (let j = i + 1; j < nodeSpheres.length; j++) {
            const dist = nodeSpheres[i].distanceTo(nodeSpheres[j]);
            // If nodes are close enough, bond them
            if (dist < 2.8) {
              linePositions.push(nodeSpheres[i].x, nodeSpheres[i].y, nodeSpheres[i].z);
              linePositions.push(nodeSpheres[j].x, nodeSpheres[j].y, nodeSpheres[j].z);
            }
          }
        }

        linesGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const networkLines = new THREE.LineSegments(
          linesGeom,
          new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2, transparent: true, opacity: 0.6 })
        );
        balls.add(networkLines);

        animationCallback = function () {
          balls.rotation.y += 0.008;
          balls.rotation.x += 0.004;
        };
        break;
      }

      case 'pricing-calculator': {
        // Voxel bar charts raising and lowering
        const barCount = 5;
        const bars = [];
        const gap = 0.8;

        const geom = new THREE.BoxGeometry(0.5, 3.5, 0.5);
        geom.translate(0, 1.75, 0); // scale upward from bottom

        for (let i = 0; i < barCount; i++) {
          const mat = new THREE.MeshPhongMaterial({
            color: i % 2 === 0 ? primaryColor : secondaryColor,
            transparent: true,
            opacity: 0.8,
            flatShading: true
          });
          const bar = new THREE.Mesh(geom, mat);
          bar.position.set((i - (barCount - 1) / 2) * gap, -1.8, 0);
          group.add(bar);
          bars.push(bar);
        }

        let time = 0;
        animationCallback = function () {
          time += 0.03;
          bars.forEach((bar, idx) => {
            // Pulsing scaling heights representing dynamic cost adjustments
            const scale = 0.3 + Math.sin(time + idx * 0.8) * 0.65;
            bar.scale.y = Math.max(0.1, scale);
            
            // Adjust opacity
            bar.material.opacity = 0.4 + (scale * 0.5);
          });
        };
        break;
      }

      case 'tech-fdm': {
        // Extruder layout
        const nozzleGeom = new THREE.ConeGeometry(0.3, 0.7, 5);
        nozzleGeom.rotateX(Math.PI);
        const nozzleMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, flatShading: true });
        const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
        group.add(nozzle);

        // Drawing a path (Helix extrusion shape)
        const helixPoints = [];
        const turns = 4;
        const pointsPerTurn = 50;
        const totalPoints = turns * pointsPerTurn;
        
        for (let i = 0; i <= totalPoints; i++) {
          const angle = (i / pointsPerTurn) * Math.PI * 2;
          const radius = 1.3 - (i / totalPoints) * 0.4;
          const h = -1.5 + (i / totalPoints) * 2.2;
          helixPoints.push(new THREE.Vector3(Math.cos(angle) * radius, h, Math.sin(angle) * radius));
        }

        // Draw tube
        const curve = new THREE.CatmullRomCurve3(helixPoints);
        const tubeGeom = new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
        const tubeMat = new THREE.MeshPhongMaterial({
          color: primaryColor,
          transparent: true,
          opacity: 0.9,
          flatShading: true
        });
        const filamentTube = new THREE.Mesh(tubeGeom, tubeMat);
        group.add(filamentTube);

        let progress = 0;
        animationCallback = function () {
          progress += 0.005;
          if (progress > 1) progress = 0;

          // Position nozzle at current curve index path
          const t = (progress * 0.9) + 0.05;
          const point = curve.getPointAt(t);
          nozzle.position.copy(point);
          nozzle.position.y += 0.35; // slightly above extrusion tip

          // Slowly rotate whole assembly
          filamentTube.rotation.y += 0.004;
          nozzle.rotation.y += 0.004;
        };
        break;
      }

      case 'tech-sla': {
        // Curing resin platform lift
        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.1, 2.5),
          new THREE.MeshPhongMaterial({ color: 0x475569 })
        );
        platform.position.y = -0.5;
        group.add(platform);

        // Glass liquid resin tank
        const tank = new THREE.Mesh(
          new THREE.BoxGeometry(3.0, 1.8, 3.0),
          new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            transmission: 0.8
          })
        );
        tank.position.y = -0.9;
        group.add(tank);

        // SLA printed component (glowing crystal shape)
        const printObj = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.8, 1),
          new THREE.MeshPhongMaterial({
            color: secondaryColor,
            emissive: secondaryColor,
            emissiveIntensity: 0.4,
            wireframe: true
          })
        );
        printObj.position.y = -0.5;
        group.add(printObj);

        // Curing Laser beam from bottom
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 2, 4),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.9 })
        );
        beam.position.y = -1.8;
        group.add(beam);

        let time = 0;
        animationCallback = function () {
          time += 0.025;
          
          // Elevate platform up and down
          const lift = Math.sin(time * 0.5) * 0.65;
          platform.position.y = lift + 0.15;
          printObj.position.y = lift + 0.15;
          printObj.rotation.y += 0.008;

          // Move laser beam sweep point under the platform
          const bx = Math.sin(time * 5) * 0.6;
          const bz = Math.cos(time * 3) * 0.6;
          beam.position.x = bx;
          beam.position.z = bz;
          
          // Connect beam to bottom of printed object
          beam.position.y = (lift - 1.0) / 2;
          beam.scale.y = Math.abs(lift - 1.25);
        };
        break;
      }

      case 'industry-aerospace': {
        // Wireframe rocket
        const bodyGeom = new THREE.CylinderGeometry(0.4, 0.4, 2.2, 8);
        const noseGeom = new THREE.ConeGeometry(0.4, 0.8, 8);
        noseGeom.translate(0, 1.5, 0);
        
        const rocket = new THREE.Group();
        const mainMesh = new THREE.Mesh(bodyGeom, wireMaterial);
        const noseMesh = new THREE.Mesh(noseGeom, wireMaterial);
        rocket.add(mainMesh);
        rocket.add(noseMesh);

        // Add wings/fins
        const finGeom = new THREE.BoxGeometry(0.7, 0.5, 0.08);
        const fin1 = new THREE.Mesh(finGeom, wireMaterial);
        fin1.position.set(0.6, -0.9, 0);
        fin1.rotation.z = Math.PI / 4;
        const fin2 = fin1.clone();
        fin2.position.x = -0.6;
        fin2.rotation.z = -Math.PI / 4;
        rocket.add(fin1);
        rocket.add(fin2);

        group.add(rocket);
        rocket.rotation.z = Math.PI / 8; // tilt

        animationCallback = function () {
          rocket.rotation.y += 0.01;
        };
        break;
      }

      case 'industry-medical': {
        // Rotating DNA double helix representation
        const helix = new THREE.Group();
        const sphereGeom = new THREE.SphereGeometry(0.12, 8, 8);
        const sphereMat = new THREE.MeshPhongMaterial({ color: secondaryColor });
        const strandCount = 14;

        for (let i = 0; i < strandCount; i++) {
          const y = -1.8 + (i / strandCount) * 3.6;
          const angle = (i / strandCount) * Math.PI * 3;
          
          const x1 = Math.cos(angle) * 0.9;
          const z1 = Math.sin(angle) * 0.9;
          const ball1 = new THREE.Mesh(sphereGeom, sphereMat);
          ball1.position.set(x1, y, z1);
          helix.add(ball1);

          const x2 = -Math.cos(angle) * 0.9;
          const z2 = -Math.sin(angle) * 0.9;
          const ball2 = new THREE.Mesh(sphereGeom, new THREE.MeshPhongMaterial({ color: primaryColor }));
          ball2.position.set(x2, y, z2);
          helix.add(ball2);

          // Add bridge line
          const lineGeom = new THREE.BufferGeometry().setFromPoints([ball1.position, ball2.position]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x64748b }));
          helix.add(line);
        }

        group.add(helix);
        animationCallback = function () {
          helix.rotation.y += 0.015;
          helix.rotation.x = Math.sin(helix.rotation.y * 0.1) * 0.25;
        };
        break;
      }

      case 'industry-automotive': {
        // Sports car wheel rim
        const wheel = new THREE.Group();
        const rimOuter = new THREE.Mesh(
          new THREE.CylinderGeometry(1.6, 1.6, 0.45, 32, 1, true),
          wireMaterial
        );
        rimOuter.rotation.x = Math.PI / 2;
        wheel.add(rimOuter);

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12),
          solidMaterial
        );
        hub.rotation.x = Math.PI / 2;
        wheel.add(hub);

        // Spokes
        const spokeGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.3);
        const spokeCount = 6;
        for (let i = 0; i < spokeCount; i++) {
          const angle = (i / spokeCount) * Math.PI * 2;
          const spoke = new THREE.Mesh(spokeGeom, solidMaterial);
          spoke.position.x = Math.cos(angle) * 0.7;
          spoke.position.y = Math.sin(angle) * 0.7;
          spoke.rotation.z = angle + Math.PI / 2;
          wheel.add(spoke);
        }

        group.add(wheel);
        wheel.rotation.x = 0.4;
        animationCallback = function () {
          wheel.rotation.z += 0.02;
        };
        break;
      }

      case 'industry-consumer': {
        // Rotating chassis casing housing structure
        const edgesGeom = new THREE.BoxGeometry(2.2, 1.8, 1.6);
        const frameEdges = new THREE.EdgesGeometry(edgesGeom);
        const casing = new THREE.LineSegments(frameEdges, new THREE.LineBasicMaterial({
          color: secondaryColor,
          linewidth: 2
        }));
        
        // Adding internal structural ribs
        const ribGeom = new THREE.BoxGeometry(1.9, 0.06, 1.3);
        const rib = new THREE.Mesh(ribGeom, wireMaterial);
        group.add(rib);
        group.add(casing);

        animationCallback = function () {
          casing.rotation.y += 0.007;
          casing.rotation.x += 0.003;
          rib.rotation.y += 0.007;
          rib.rotation.x += 0.003;
        };
        break;
      }

      case 'gallery-candlestick': {
        const candlestick = new THREE.Group();
        
        // Pedestal base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.15, 24), solidMaterial);
        base.position.y = -1.2;
        candlestick.add(base);
        
        // Stem neck
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.4, 16), solidMaterial);
        stem.position.y = -0.9;
        candlestick.add(stem);
        
        // Complex hollow lattice knot representing the 3D printed body
        const knotGeom = new THREE.TorusKnotGeometry(0.5, 0.16, 80, 8, 3, 4);
        const knot = new THREE.Mesh(knotGeom, wireMaterial);
        knot.position.y = 0.1;
        candlestick.add(knot);
        
        // Upper candle bowl
        const topHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.3, 16), solidMaterial);
        topHolder.position.y = 1.0;
        candlestick.add(topHolder);
        
        // Wax candle shaft
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16), glassMaterial);
        candle.position.y = 1.45;
        candlestick.add(candle);
        
        group.add(candlestick);
        candlestick.rotation.x = 0.3;
        animationCallback = function () {
          candlestick.rotation.y += 0.01;
        };
        break;
      }

      case 'gallery-propeller': {
        const prop = new THREE.Group();
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), solidMaterial);
        hub.rotation.x = Math.PI / 2;
        prop.add(hub);

        const bladeGeom = new THREE.BoxGeometry(2.4, 0.15, 0.04);
        bladeGeom.rotateZ(0.15); // angle of attack
        const blade = new THREE.Mesh(bladeGeom, wireMaterial);
        prop.add(blade);

        group.add(prop);
        prop.rotation.x = 0.6;
        animationCallback = function () {
          prop.rotation.y += 0.08; // high speed rotor spin
        };
        break;
      }

      case 'gallery-aligner': {
        // Curved mouth guide wireframe
        const arch = new THREE.Group();
        const splinePoints = [];
        const radius = 1.2;
        const steps = 30;
        
        for (let i = 0; i <= steps; i++) {
          const pct = i / steps;
          const theta = Math.PI * 0.15 + pct * Math.PI * 0.7; // semi circular arch
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          const y = Math.sin(pct * Math.PI) * 0.2; // slight arch height
          splinePoints.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(splinePoints);
        const tubeGeom = new THREE.TubeGeometry(curve, 40, 0.15, 8, false);
        const mesh = new THREE.Mesh(tubeGeom, glassMaterial);
        arch.add(mesh);
        
        group.add(arch);
        arch.rotation.x = 0.5;
        animationCallback = function () {
          arch.rotation.y += 0.01;
        };
        break;
      }

      case 'gallery-manifold': {
        // Torus knot representing custom piping flow
        const manifold = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.9, 0.26, 120, 16),
          glassMaterial
        );
        group.add(manifold);
        animationCallback = function () {
          manifold.rotation.y += 0.01;
          manifold.rotation.x += 0.005;
        };
        break;
      }

      case 'gallery-midsole': {
        // Voxel/Lattice shoe midsole simulation block
        const midsole = new THREE.Group();
        const rows = 5;
        const cols = 3;
        const depth = 2;
        
        const linesGeom = new THREE.BufferGeometry();
        const linePoints = [];

        // Build a grid of interconnected nodes
        for (let x = 0; x < rows; x++) {
          for (let y = 0; y < cols; y++) {
            for (let z = 0; z < depth; z++) {
              const px = (x - (rows - 1) / 2) * 0.45;
              const py = (y - (cols - 1) / 2) * 0.45;
              const pz = (z - (depth - 1) / 2) * 0.45;
              
              const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 4, 4),
                new THREE.MeshBasicMaterial({ color: primaryColor })
              );
              sphere.position.set(px, py, pz);
              midsole.add(sphere);

              // Connect lines to adjacent points
              if (x > 0) linePoints.push(px - 0.45, py, pz, px, py, pz);
              if (y > 0) linePoints.push(px, py - 0.45, pz, px, py, pz);
              if (z > 0) linePoints.push(px, py, pz - 0.45, px, py, pz);
            }
          }
        }

        linesGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
        const gridLines = new THREE.LineSegments(
          linesGeom,
          new THREE.LineBasicMaterial({ color: secondaryColor, transparent: true, opacity: 0.7 })
        );
        midsole.add(gridLines);

        group.add(midsole);
        midsole.rotation.x = 0.4;
        animationCallback = function () {
          midsole.rotation.y += 0.008;
        };
        break;
      }

      case 'gallery-joint': {
        // Two interlocking bionic loops rotating perpendicular to each other
        const ringGeom = new THREE.TorusGeometry(1.0, 0.12, 16, 60);
        const ring1 = new THREE.Mesh(ringGeom, solidMaterial);
        const ring2 = new THREE.Mesh(ringGeom, new THREE.MeshPhongMaterial({
          color: primaryColor,
          flatShading: true
        }));
        ring2.rotation.y = Math.PI / 2;

        group.add(ring1);
        group.add(ring2);

        animationCallback = function () {
          ring1.rotation.z += 0.012;
          ring2.rotation.x += 0.015;
        };
        break;
      }

      case 'blog-wall': {
        // Rotating shell cube demonstrating slicing wall thickness
        const shellOuter = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 2.0, 2.0),
          new THREE.MeshPhongMaterial({
            color: secondaryColor,
            transparent: true,
            opacity: 0.15,
            wireframe: true
          })
        );
        const shellInner = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.6, 1.6),
          new THREE.MeshPhongMaterial({
            color: primaryColor,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          })
        );

        group.add(shellOuter);
        group.add(shellInner);

        let time = 0;
        animationCallback = function () {
          time += 0.02;
          shellOuter.rotation.y += 0.006;
          shellOuter.rotation.x += 0.003;
          shellInner.rotation.y += 0.006;
          shellInner.rotation.x += 0.003;

          // Pulse inner shell scaling to represent thickness changes
          const scale = 0.75 + Math.sin(time) * 0.15;
          shellInner.scale.set(scale, scale, scale);
        };
        break;
      }

      case 'blog-materials': {
        // Three floating geometries: Polymer Cube, Resin Pyramid, Metal Octahedron
        const polyCube = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshPhongMaterial({
          color: 0xef4444, // polymer red
          flatShading: true
        }));
        polyCube.position.set(-1.3, 0.4, 0);

        const resinPyr = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.8, 4), glassMaterial);
        resinPyr.position.set(0, -0.4, 0.5);

        const metalOct = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({
          color: 0x94a3b8, // silver metal
          roughness: 0.15,
          metalness: 0.85
        }));
        metalOct.position.set(1.3, 0.4, 0);

        group.add(polyCube);
        group.add(resinPyr);
        group.add(metalOct);

        let time = 0;
        animationCallback = function () {
          time += 0.02;
          
          // Animate floating heights
          polyCube.position.y = 0.3 + Math.sin(time) * 0.25;
          polyCube.rotation.x += 0.01;
          polyCube.rotation.y += 0.015;

          resinPyr.position.y = -0.3 + Math.sin(time + 1.2) * 0.2;
          resinPyr.rotation.y += 0.008;

          metalOct.position.y = 0.3 + Math.sin(time + 2.4) * 0.25;
          metalOct.rotation.x -= 0.015;
          metalOct.rotation.z += 0.01;
        };
        break;
      }

      case 'blog-sintering': {
        // Rotating turbine with particle sparks
        const turbine = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.8, 0.25, 64, 8),
          new THREE.MeshStandardMaterial({
            color: 0x94a3b8, // steel
            roughness: 0.2,
            metalness: 0.8
          })
        );
        group.add(turbine);

        // Sintering laser beam
        const laser = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 2, 4),
          new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 })
        );
        laser.position.set(0.6, 0.8, 0.2);
        laser.rotation.z = -Math.PI / 4;
        group.add(laser);

        // Particle group (sparks)
        const sparksCount = 20;
        const sparksGeom = new THREE.BufferGeometry();
        const sparksPositions = new Float32Array(sparksCount * 3);
        const sparksVels = [];

        const targetPos = new THREE.Vector3(0.3, 0.3, 0.1);

        for (let i = 0; i < sparksCount; i++) {
          sparksPositions[i * 3] = targetPos.x;
          sparksPositions[i * 3 + 1] = targetPos.y;
          sparksPositions[i * 3 + 2] = targetPos.z;

          sparksVels.push(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.15,
            (Math.random() - 0.5) * 0.1
          );
        }

        sparksGeom.setAttribute('position', new THREE.BufferAttribute(sparksPositions, 3));
        const sparksMat = new THREE.PointsMaterial({
          color: 0xf59e0b, // amber sparks
          size: 0.08,
          transparent: true,
          opacity: 0.9
        });
        const sparksPoints = new THREE.Points(sparksGeom, sparksMat);
        group.add(sparksPoints);

        animationCallback = function () {
          turbine.rotation.y += 0.012;

          // Animate particle sparks emitting from laser impact point
          const pos = sparksGeom.attributes.position.array;
          for (let i = 0; i < sparksCount; i++) {
            pos[i * 3] += sparksVels[i * 3];
            pos[i * 3 + 1] += sparksVels[i * 3 + 1];
            pos[i * 3 + 2] += sparksVels[i * 3 + 2];

            // Reset sparks that fly too far
            const dx = pos[i * 3] - targetPos.x;
            const dy = pos[i * 3 + 1] - targetPos.y;
            const dz = pos[i * 3 + 2] - targetPos.z;
            if (dx*dx + dy*dy + dz*dz > 1.5) {
              pos[i * 3] = targetPos.x;
              pos[i * 3 + 1] = targetPos.y;
              pos[i * 3 + 2] = targetPos.z;
            }
          }
          sparksGeom.attributes.position.needsUpdate = true;
        };
        break;
      }

      case 'contact-beacon': {
        // Central core beacon
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 24, 24),
          new THREE.MeshPhongMaterial({
            color: secondaryColor,
            emissive: secondaryColor,
            emissiveIntensity: 0.6
          })
        );
        group.add(core);

        // Concentric surrounding rings
        const rings = [];
        const ringGeom = new THREE.RingGeometry(1.2, 1.25, 32);
        
        for (let i = 0; i < 3; i++) {
          const ringMat = new THREE.MeshBasicMaterial({
            color: primaryColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
          group.add(ring);
          rings.push(ring);
        }

        // Pulse beacon shell
        const pulseShell = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 24, 24),
          new THREE.MeshBasicMaterial({
            color: secondaryColor,
            transparent: true,
            opacity: 0.35
          })
        );
        group.add(pulseShell);

        let time = 0;
        animationCallback = function () {
          time += 0.015;
          core.rotation.y += 0.005;

          // Rotate rings on offset angles
          rings[0].rotation.x += 0.01;
          rings[1].rotation.y += 0.015;
          rings[2].rotation.z += 0.008;

          // Pulsing expansion shell
          const scale = 1.0 + (time % 1) * 2.0;
          pulseShell.scale.set(scale, scale, scale);
          pulseShell.material.opacity = 0.5 * (1 - (time % 1));
        };
        break;
      }

      default: {
        // Fallback cube
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), wireMaterial);
        group.add(box);
        animationCallback = function () {
          box.rotation.y += 0.01;
          box.rotation.z += 0.005;
        };
      }
    }

    return animationCallback;
  }

  // Initialize script execution
  loadScript(THREE_JS_URL, () => {
    // Wait for DOM to ensure selectors exist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEngine);
    } else {
      initEngine();
    }
  });

  // Export globally for updates (like lightbox dynamic updates)
  window.Stackly3D = window.Stackly3D || {};
  window.Stackly3D.initEngine = initEngine;
  window.Stackly3D.create3DScene = create3DScene;
  window.Stackly3D.activeScenes = activeScenes;

})();

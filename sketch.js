let flock = [];

let cam;

let currentBoundary = false;

let boundaryX = 0;
let boundaryY = 0;
let boundaryZ = 0;

function firstPersonCamera(cam, speed = 10) {
    // store state
    if (typeof cam.firstPersonCameraState === 'undefined') {
        cam.firstPersonCameraState = {
            azimuth: -Math.atan2(cam.eyeZ - cam.centerZ, cam.eyeX - cam.centerX),
            zenith: -Math.atan2(cam.eyeY - cam.centerY, dist(cam.eyeX, cam.eyeZ, cam.centerX, cam.centerZ)),
            lookAtDistance: dist(cam.eyeX, cam.eyeY, cam.eyeZ, cam.centerX, cam.centerY, cam.centerZ),
            previousMouseX: mouseX,
            previousMouseY: mouseY
        };
    }

    // look around
    if (mouseIsPressed) {
        cam.firstPersonCameraState.azimuth -= (mouseX - cam.firstPersonCameraState.previousMouseX) / 100;

        if (Math.abs(cam.firstPersonCameraState.zenith + (mouseY - cam.firstPersonCameraState.previousMouseY) / 100) < Math.PI / 2) {
            cam.firstPersonCameraState.zenith += (mouseY - cam.firstPersonCameraState.previousMouseY) / 100;
        }
    }

    // movement
    if (keyIsPressed) {
        // forwards and backwards
        if (keyCode == 87) { // 87: w
            cam.eyeX -= speed * Math.cos(cam.firstPersonCameraState.azimuth);
            cam.eyeZ += speed * Math.sin(cam.firstPersonCameraState.azimuth);
        }
        else if (keyCode == 83) { // 83: s
            cam.eyeX += speed * Math.cos(cam.firstPersonCameraState.azimuth);
            cam.eyeZ -= speed * Math.sin(cam.firstPersonCameraState.azimuth);
        }

        // side
        else if (keyCode == 65) { // 65: a
            cam.eyeX -= speed * Math.cos(cam.firstPersonCameraState.azimuth + Math.PI / 2);
            cam.eyeZ += speed * Math.sin(cam.firstPersonCameraState.azimuth + Math.PI / 2);
        }
        else if (keyCode == 68) { // 68: d
            cam.eyeX += speed * Math.cos(cam.firstPersonCameraState.azimuth + Math.PI / 2);
            cam.eyeZ -= speed * Math.sin(cam.firstPersonCameraState.azimuth + Math.PI / 2);
        }

        // up and dowm
        else if (keyCode == 16) { // 16: shift
            cam.eyeY += speed;
        }
        else if (keyCode == 32) { // 32: space
            cam.eyeY -= speed;
        }
    }

    // update previous mouse position
    cam.firstPersonCameraState.previousMouseX = mouseX;
    cam.firstPersonCameraState.previousMouseY = mouseY;

    // update look-at point
    cam.centerX = cam.eyeX - cam.firstPersonCameraState.lookAtDistance * Math.cos(cam.firstPersonCameraState.zenith) * Math.cos(cam.firstPersonCameraState.azimuth);
    cam.centerY = cam.eyeY + cam.firstPersonCameraState.lookAtDistance * Math.sin(cam.firstPersonCameraState.zenith);
    cam.centerZ = cam.eyeZ + cam.firstPersonCameraState.lookAtDistance * Math.cos(cam.firstPersonCameraState.zenith) * Math.sin(cam.firstPersonCameraState.azimuth);

    // position and orient the camera
    camera(cam.eyeX, cam.eyeY, cam.eyeZ, // position
        cam.centerX, cam.centerY, cam.centerZ, // look-at point
        0, 1, 0); // up vector
}

function toggleBoundary() {
    currentBoundary = !currentBoundary;

    if (currentBoundary) {
        document.getElementById('boundaryButton').value = 'Has boundaries';
    }
    else {
        document.getElementById('boundaryButton').value = 'No boundaries';
    }
}

function adjustSize() {
    boundaryX = (windowWidth - 16) / 2;
    boundaryY = (windowHeight - 64) / 2;

    document.getElementById('depthSlider').max = boundaryX;
}

function setup() {
    createCanvas(windowWidth - 16, windowHeight - 64, WEBGL);
    cam = createCamera();

    adjustSize();

    const n = 512;
    for (let i = 0; i < n; i++) {
        flock.push(new Boid(boundaryX, boundaryY, boundaryZ));
    }
}

function windowResized() {
    resizeCanvas(windowWidth - 16, windowHeight - 64);
    adjustSize();
}

function draw() {
    background(32, 32, 32);

    boundaryZ = Number(document.getElementById('depthSlider').value);
    const alignment = Number(document.getElementById('alignmentSlider').value);
    const cohesion = Number(document.getElementById('cohesionSlider').value);
    const separation = Number(document.getElementById('separationSlider').value);

    noFill();
    stroke(255);
    box(-boundaryX * 2, -boundaryY * 2, -boundaryZ * 2);

    for (let i = 0; i < flock.length; i++) {
        const boid = flock[i];

        if (currentBoundary) {
            boid.boundary(boundaryX, boundaryY, boundaryZ);
        }
        else {
            boid.infiniteBoundary(boundaryX, boundaryY, boundaryZ);
        }

        boid.flocking(flock, alignment, cohesion, separation);
        boid.update();
        boid.draw();
    }

    firstPersonCamera(cam, 20);
}

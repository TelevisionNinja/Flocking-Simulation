function distance(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
}

function distanceFast(x, y, z) {
    return x * x + y * y + z * z;
}

/**
 * 
 * @param {*} min inclusive min
 * @param {*} max 
 * @param {*} inclusive exclusive max
 * @returns 
 */
function randomValue(min = 0, max = 0) {
    if (max === min) {
        return max;
    }

    if (min > max) {
        const temp = max;
        max = min;
        min = temp;
    }

    return Math.random() * (max - min) + min;
}

function limitMaxMagnitude(limit, vector) {
    const d = distance(vector.x, vector.y, vector.z);

    if (limit < d) {
        const proportion = limit / d;

        return {
            x: vector.x * proportion,
            y: vector.y * proportion,
            z: vector.z * proportion
        };
    }

    return vector;
}

function addition(vectorOne, vectorTwo) {
    return {
        x: vectorOne.x + vectorTwo.x,
        y: vectorOne.y + vectorTwo.y,
        z: vectorOne.z + vectorTwo.z
    };
}

function subtraction(vectorOne, vectorTwo) {
    return {
        x: vectorOne.x - vectorTwo.x,
        y: vectorOne.y - vectorTwo.y,
        z: vectorOne.z - vectorTwo.z
    };
}

function multiplication(scalar, vector) {
    return {
        x: scalar * vector.x,
        y: scalar * vector.y,
        z: scalar * vector.z
    };
}

function division(scalar, vector) {
    return {
        x: vector.x / scalar,
        y: vector.y / scalar,
        z: vector.z / scalar
    };
}

function setMagnitude(magnitude, vector) {
    const d = distance(vector.x, vector.y, vector.z);
    const proportion = magnitude / d;

    return {
        x: vector.x * proportion,
        y: vector.y * proportion,
        z: vector.z * proportion
    };
}

function drawSphere(vector, radius) {
    push();
    translate(vector.x, vector.y, vector.z);
    sphere(radius);
    pop();
}

class Boid {
    constructor(boundaryX, boundaryY, boundaryZ) {
        this.position = {
            x: randomValue(-boundaryX, boundaryX),
            y: randomValue(-boundaryY, boundaryY),
            z: randomValue(-boundaryZ, boundaryZ)
        };

        this.minVelocity = 2;
        this.maxVelocity = 10;

        this.velocity = {
            x: randomValue(-this.maxVelocity, this.maxVelocity),
            y: randomValue(-this.maxVelocity, this.maxVelocity),
            z: randomValue(-this.maxVelocity, this.maxVelocity)
        };

        this.velocity = setMagnitude(randomValue(this.minVelocity, this.maxVelocity), this.velocity);

        this.acceleration = {
            x: 0,
            y: 0,
            z: 0
        };

        this.maxForce = 0.5;
        this.pointing = {
            x: 0,
            y: 0,
            z: 0
        };
    }

    update() {
        this.pointing = this.position;

        this.position = addition(this.position, this.velocity);
        this.velocity = addition(this.velocity, this.acceleration);
        this.velocity = limitMaxMagnitude(this.maxVelocity, this.velocity);
        this.acceleration = multiplication(0, this.acceleration);

        // line of direction
        this.pointing = subtraction(this.position, this.pointing);
        this.pointing = setMagnitude(15, this.pointing);
        this.pointing = addition(this.position, this.pointing);
    }

    draw() {
        stroke(255);
        drawSphere(this.position, 3);
        strokeWeight(3);
        line(this.position.x, this.position.y, this.position.z, this.pointing.x, this.pointing.y, this.pointing.z);
    }

    /**
     * treat boundary as a wall
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    boundary(x, y, z) {
        if (this.position.x > x) {
            this.position.x = x;
            this.velocity.x = -this.velocity.x / 2;
        }
        else if (this.position.x < -x) {
            this.position.x = -x;
            this.velocity.x = -this.velocity.x / 2;
        }

        if (this.position.y > y) {
            this.position.y = y;
            this.velocity.y = -this.velocity.y / 2;
        }
        else if (this.position.y < -y) {
            this.position.y = -y;
            this.velocity.y = -this.velocity.y / 2;
        }

        if (this.position.z > z) {
            this.position.z = z;
            this.velocity.z = -this.velocity.z / 2;
        }
        else if (this.position.z < -z) {
            this.position.z = -z;
            this.velocity.z = -this.velocity.z / 2;
        }
    }

    /**
     * treat boundary as infinite space
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     */
    infiniteBoundary(x, y, z) {
        if (this.position.x > x) {
            this.position.x = -x;
        }
        else if (this.position.x < -x) {
            this.position.x = x;
        }

        if (this.position.y > y) {
            this.position.y = -y;
        }
        else if (this.position.y < -y) {
            this.position.y = y;
        }

        if (this.position.z > z) {
            this.position.z = -z;
        }
        else if (this.position.z < -z) {
            this.position.z = z;
        }
    }

    flocking(boids, alignmentProportion = 1, cohesionProportion = 1, separationProportion = 1) {
        let alignmentPerceptionRadius = 35;
        alignmentPerceptionRadius *= alignmentPerceptionRadius;
        let alignmentSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let alignmentTotal = 0;

        let cohesionPerceptionRadius = 50;
        cohesionPerceptionRadius *= cohesionPerceptionRadius;
        let cohesionSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let cohesionTotal = 0;

        let separationPerceptionRadius = 25;
        separationPerceptionRadius *= separationPerceptionRadius;
        let separationSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let separationTotal = 0;

        for (let i = 0; i < boids.length; i++) {
            const other = boids[i];
            const d = distanceFast(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (other !== this) {
                if (d < alignmentPerceptionRadius) {
                    alignmentSteering = addition(alignmentSteering, other.velocity);
                    alignmentTotal++;
                }

                if (d < cohesionPerceptionRadius) {
                    cohesionSteering = addition(cohesionSteering, other.position);
                    cohesionTotal++;
                }

                if (d < separationPerceptionRadius && d > 0) {
                    let difference = subtraction(this.position, other.position);
                    difference = division(d, difference);
                    separationSteering = addition(separationSteering, difference);

                    separationTotal++;
                }
            }
        }

        if (alignmentTotal > 0) {
            alignmentSteering = division(alignmentTotal, alignmentSteering);
            alignmentSteering = setMagnitude(this.maxVelocity, alignmentSteering);
            alignmentSteering = subtraction(alignmentSteering, this.velocity);
            alignmentSteering = limitMaxMagnitude(this.maxForce, alignmentSteering);
            alignmentSteering = multiplication(alignmentProportion, alignmentSteering);
            this.acceleration = addition(this.acceleration, alignmentSteering);
        }

        if (cohesionTotal > 0) {
            cohesionSteering = division(cohesionTotal, cohesionSteering);
            cohesionSteering = subtraction(cohesionSteering, this.position);
            cohesionSteering = setMagnitude(this.maxVelocity, cohesionSteering);
            cohesionSteering = subtraction(cohesionSteering, this.velocity);
            cohesionSteering = limitMaxMagnitude(this.maxForce, cohesionSteering);
            cohesionSteering = multiplication(cohesionProportion, cohesionSteering);
            this.acceleration = addition(this.acceleration, cohesionSteering);
        }

        if (separationTotal > 0) {
            separationSteering = division(separationTotal, separationSteering);
            separationSteering = setMagnitude(this.maxVelocity, separationSteering);
            separationSteering = subtraction(separationSteering, this.velocity);
            separationSteering = limitMaxMagnitude(this.maxForce, separationSteering);
            separationSteering = multiplication(separationProportion, separationSteering);
            this.acceleration = addition(this.acceleration, separationSteering);
        }
    }
}

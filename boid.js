function distance(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
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

    alignment(boids) {
        let perceptionRadius = 35;
        let steering = {
            x: 0,
            y: 0,
            z: 0
        };
        let total = 0;

        for (let i = 0; i < boids.length; i++) {
            const other = boids[i];
            const d = distance(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (other !== this && d < perceptionRadius) {
                steering = addition(steering, other.velocity);
                total++;
            }
        }

        if (total > 0) {
            steering = division(total, steering);
            steering = setMagnitude(this.maxVelocity, steering);
            steering = subtraction(steering, this.velocity);
            steering = limitMaxMagnitude(this.maxForce, steering);
        }

        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 50;
        let steering = {
            x: 0,
            y: 0,
            z: 0
        };
        let total = 0;

        for (let i = 0; i < boids.length; i++) {
            const other = boids[i];
            const d = distance(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (other !== this && d < perceptionRadius) {
                steering = addition(steering, other.position);
                total++;
            }
        }

        if (total > 0) {
            steering = division(total, steering);
            steering = subtraction(steering, this.position);
            steering = setMagnitude(this.maxVelocity, steering);
            steering = subtraction(steering, this.velocity);
            steering = limitMaxMagnitude(this.maxForce, steering);
        }

        return steering;
    }

    separation(boids) {
        let perceptionRadius = 25;
        let steering = {
            x: 0,
            y: 0,
            z: 0
        };
        let total = 0;

        for (let i = 0; i < boids.length; i++) {
            const other = boids[i];
            const d = distance(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (other !== this && d < perceptionRadius && d > 0) {
                let difference = subtraction(this.position, other.position);
                const dSquared = d * d;
                difference = division(dSquared, difference);
                steering = addition(steering, difference);

                total++;
            }
        }

        if (total > 0) {
            steering = division(total, steering);
            steering = setMagnitude(this.maxVelocity, steering);
            steering = subtraction(steering, this.velocity);
            steering = limitMaxMagnitude(this.maxForce, steering);
        }

        return steering;
    }

    flocking(boids, alignmentProportion = 1, cohesionProportion = 1, separationProportion = 1) {
        let alignment = this.alignment(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        alignment = multiplication(alignmentProportion, alignment);
        cohesion = multiplication(cohesionProportion, cohesion);
        separation = multiplication(separationProportion, separation);

        this.acceleration = addition(this.acceleration, alignment);
        this.acceleration = addition(this.acceleration, cohesion);
        this.acceleration = addition(this.acceleration, separation);
    }
}

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

function drawSphere(vector, radius, subdivisionsX = 3, subdivisionsY = 3) {
    push();
    translate(vector.x, vector.y, vector.z);
    sphere(radius, subdivisionsX, subdivisionsY);
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
    }

    update() {
        this.position = addition(this.position, this.velocity);
        this.velocity = addition(this.velocity, this.acceleration);
        this.velocity = limitMaxMagnitude(this.maxVelocity, this.velocity);
        this.acceleration = multiplication(0, this.acceleration);
    }

    draw(fastMode) {
        if (fastMode) {
            point(this.position.x, this.position.y, this.position.z);
        }
        else {
            drawSphere(this.position, 2);
            const pointing = addition(this.position, setMagnitude(15, this.velocity));
            line(this.position.x, this.position.y, this.position.z, pointing.x, pointing.y, pointing.z);
        }
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

    alignment(octree, alignmentProportion = 1) {
        let alignmentPerceptionRadius = 35;

        const alignmentTopLeftFront = create3dVector(this.position.x - alignmentPerceptionRadius,
                    this.position.y - alignmentPerceptionRadius,
                    this.position.z - alignmentPerceptionRadius);
        const alignmentBottomRightBack = create3dVector(this.position.x + alignmentPerceptionRadius,
                    this.position.y + alignmentPerceptionRadius,
                    this.position.z + alignmentPerceptionRadius);

        alignmentPerceptionRadius *= alignmentPerceptionRadius;
        let alignmentSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let alignmentTotal = 0;
        let alignmentBoids = octree.getVectorsIterative(alignmentTopLeftFront, alignmentBottomRightBack);

        for (let i = 0; i < alignmentBoids.length; i++) {
            const other = alignmentBoids[i];
            const d = distanceFast(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (d < alignmentPerceptionRadius) {
                alignmentSteering = addition(alignmentSteering, other.velocity);
                alignmentTotal++;
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
    }

    cohesion(octree, cohesionProportion = 1) {
        let cohesionPerceptionRadius = 50;

        const cohesionTopLeftFront = create3dVector(this.position.x - cohesionPerceptionRadius,
                    this.position.y - cohesionPerceptionRadius,
                    this.position.z - cohesionPerceptionRadius);
        const cohesionBottomRightBack = create3dVector(this.position.x + cohesionPerceptionRadius,
                    this.position.y + cohesionPerceptionRadius,
                    this.position.z + cohesionPerceptionRadius);

        cohesionPerceptionRadius *= cohesionPerceptionRadius;
        let cohesionSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let cohesionTotal = 0;
        let cohesionBoids = octree.getVectorsIterative(cohesionTopLeftFront, cohesionBottomRightBack);

        for (let i = 0; i < cohesionBoids.length; i++) {
            const other = cohesionBoids[i];
            const d = distanceFast(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (d < cohesionPerceptionRadius) {
                cohesionSteering = addition(cohesionSteering, other.position);
                cohesionTotal++;
            }
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
    }

    separation(octree, separationProportion = 1) {
        let separationPerceptionRadius = 25;

        const separationTopLeftFront = create3dVector(this.position.x - separationPerceptionRadius,
                    this.position.y - separationPerceptionRadius,
                    this.position.z - separationPerceptionRadius);
        const separationBottomRightBack = create3dVector(this.position.x + separationPerceptionRadius,
                        this.position.y + separationPerceptionRadius,
                        this.position.z + separationPerceptionRadius);

        separationPerceptionRadius *= separationPerceptionRadius;
        let separationSteering = {
            x: 0,
            y: 0,
            z: 0
        };
        let separationTotal = 0;
        let separationBoids = octree.getVectorsIterative(separationTopLeftFront, separationBottomRightBack);

        for (let i = 0; i < separationBoids.length; i++) {
            const other = separationBoids[i];
            const d = distanceFast(this.position.x - other.position.x, this.position.y - other.position.y, this.position.z - other.position.z);

            if (d < separationPerceptionRadius && d > 0) {
                let difference = subtraction(this.position, other.position);
                difference = division(d, difference);
                separationSteering = addition(separationSteering, difference);

                separationTotal++;
            }
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

    flocking(octree, alignmentProportion = 1, cohesionProportion = 1, separationProportion = 1, fastMode = false) {
        if (fastMode) {
            const limit = 64;

            let alignmentPerceptionRadius = 35;

            // const alignmentTopLeftFront = create3dVector(this.position.x - alignmentPerceptionRadius,
            //             this.position.y - alignmentPerceptionRadius,
            //             this.position.z - alignmentPerceptionRadius);
            // const alignmentBottomRightBack = create3dVector(this.position.x + alignmentPerceptionRadius,
            //             this.position.y + alignmentPerceptionRadius,
            //             this.position.z + alignmentPerceptionRadius);

            alignmentPerceptionRadius *= alignmentPerceptionRadius;
            let alignmentSteering = {
                x: 0,
                y: 0,
                z: 0
            };
            let alignmentTotal = 0;
            // let alignmentBoids = octree.getVectorsIterative(alignmentTopLeftFront, alignmentBottomRightBack, 128);

            let cohesionPerceptionRadius = 50;

            const cohesionTopLeftFront = create3dVector(this.position.x - cohesionPerceptionRadius,
                        this.position.y - cohesionPerceptionRadius,
                        this.position.z - cohesionPerceptionRadius);
            const cohesionBottomRightBack = create3dVector(this.position.x + cohesionPerceptionRadius,
                        this.position.y + cohesionPerceptionRadius,
                        this.position.z + cohesionPerceptionRadius);

            cohesionPerceptionRadius *= cohesionPerceptionRadius;
            let cohesionSteering = {
                x: 0,
                y: 0,
                z: 0
            };
            let cohesionTotal = 0;
            let cohesionBoids = octree.getVectorsIterative(cohesionTopLeftFront, cohesionBottomRightBack, 128);

            let separationPerceptionRadius = 25;

            // const separationTopLeftFront = create3dVector(this.position.x - separationPerceptionRadius,
            //             this.position.y - separationPerceptionRadius,
            //             this.position.z - separationPerceptionRadius);
            // const separationBottomRightBack = create3dVector(this.position.x + separationPerceptionRadius,
            //                 this.position.y + separationPerceptionRadius,
            //                 this.position.z + separationPerceptionRadius);

            separationPerceptionRadius *= separationPerceptionRadius;
            let separationSteering = {
                x: 0,
                y: 0,
                z: 0
            };
            let separationTotal = 0;
            // let separationBoids = octree.getVectorsIterative(separationTopLeftFront, separationBottomRightBack, 128);

            for (let i = 0; i < cohesionBoids.length; i++) {
                const other = cohesionBoids[i];
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

                // some correction for small sample on large population
                if (alignmentTotal >= limit) {
                    alignmentSteering = multiplication(limit / (alignmentTotal * 2), alignmentSteering);
                }

                this.acceleration = addition(this.acceleration, alignmentSteering);
            }

            if (cohesionTotal > 0) {
                cohesionSteering = division(cohesionTotal, cohesionSteering);
                cohesionSteering = subtraction(cohesionSteering, this.position);
                cohesionSteering = setMagnitude(this.maxVelocity, cohesionSteering);
                cohesionSteering = subtraction(cohesionSteering, this.velocity);
                cohesionSteering = limitMaxMagnitude(this.maxForce, cohesionSteering);
                cohesionSteering = multiplication(cohesionProportion, cohesionSteering);

                // some correction for small sample on large population
                if (cohesionTotal >= limit / 2) {
                    cohesionSteering = multiplication(cohesionTotal / (limit * 1.5), cohesionSteering);
                }

                this.acceleration = addition(this.acceleration, cohesionSteering);
            }

            if (separationTotal > 0) {
                separationSteering = division(separationTotal, separationSteering);
                separationSteering = setMagnitude(this.maxVelocity, separationSteering);
                separationSteering = subtraction(separationSteering, this.velocity);
                separationSteering = limitMaxMagnitude(this.maxForce, separationSteering);
                separationSteering = multiplication(separationProportion, separationSteering);

                // some correction for small sample on large population
                if (separationTotal >= limit / 2) {
                    separationSteering = multiplication(4 * separationTotal / limit, separationSteering);
                }

                this.acceleration = addition(this.acceleration, separationSteering);
            }
        }
        else {
            this.alignment(octree, alignmentProportion);
            this.cohesion(octree, cohesionProportion);
            this.separation(octree, separationProportion);
        }
    }
}

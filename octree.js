const TopLeftFront = 0;
const TopRightFront = 1;
const BottomRightFront = 2;
const BottomLeftFront = 3;
const TopLeftBottom = 4;
const TopRightBottom = 5;
const BottomRightBack = 6;
const BottomLeftBack = 7;

function create3dVector(x, y, z) {
    return {
        position: {
            x: x,
            y: y,
            z: z,
        }
    };
}

function drawBox(x, y, z, width, height, depth) {
    push();
    translate(x, y, z);
    box(width, height, depth);
    pop();
}

class Octree {
    constructor(topLeftFrontVector, bottomRightBackVector, startingLimit = 2, fastMode = false, limitIncreaseAmount = 1, depthLimit = 32) {
        this.values = [];

        if (startingLimit < 1) {
            this.startingLimit = 1;
        }
        else {
            this.startingLimit = startingLimit;
        }

        this.isSubdivided = false;
        this.topLeftFront = topLeftFrontVector;
        this.bottomRightBack = bottomRightBackVector;
        this.children = [null, null, null, null, null, null, null, null];

        this.fastMode = fastMode;
        this.limitIncreaseAmount = limitIncreaseAmount;
        this.depthLimit = depthLimit;
        this.depth = 0;
    }

    getMidpoints() {
        const middleX = (this.topLeftFront.position.x + this.bottomRightBack.position.x) / 2;
        const middleY = (this.topLeftFront.position.y + this.bottomRightBack.position.y) / 2;
        const middleZ = (this.topLeftFront.position.z + this.bottomRightBack.position.z) / 2;

        return {
            middleX,
            middleY,
            middleZ
        };
    }

    getChildIndex(vector) {
        // binary search for insertion
        const {
            middleX,
            middleY,
            middleZ
        } = this.getMidpoints();
        let position = 0;

        // get the octant
        if (vector.position.x <= middleX) {
            if (vector.position.y <= middleY) {
                if (vector.position.z <= middleZ) {
                    position = TopLeftFront;
                }
                else {
                    position = TopLeftBottom;
                }
            }
            else {
                if (vector.position.z <= middleZ) {
                    position = BottomLeftFront;
                }
                else {
                    position = BottomLeftBack;
                }
            }
        }
        else {
            if (vector.position.y <= middleY) {
                if (vector.position.z <= middleZ) {
                    position = TopRightFront;
                }
                else {
                    position = TopRightBottom;
                }
            }
            else {
                if (vector.position.z <= middleZ) {
                    position = BottomRightFront;
                }
                else {
                    position = BottomRightBack;
                }
            }
        }

        return {
            position,
            middleX,
            middleY,
            middleZ
        };
    }

    isPointInCube(vector, topLeftFront, bottomRightBack) {
        return vector.position.x >= topLeftFront.position.x
            && vector.position.x <= bottomRightBack.position.x
            && vector.position.y >= topLeftFront.position.y
            && vector.position.y <= bottomRightBack.position.y
            && vector.position.z >= topLeftFront.position.z
            && vector.position.z <= bottomRightBack.position.z;
    }

    insert(vector) {
        if (!this.isPointInCube(vector, this.topLeftFront, this.bottomRightBack)) {
            return;
        }

        if (this.depthLimit <= this.depth || (!this.isSubdivided && this.values.length < this.startingLimit)) {
            this.values.push(vector);
            return;
        }

        this.isSubdivided = true;

        const {
            position,
            middleX,
            middleY,
            middleZ
        } = this.getChildIndex(vector);

        const currentChild = this.children[position];

        // add child nodes
        if (currentChild === null) {
            if (position === TopLeftFront) {
                this.children[position] = new Octree(this.topLeftFront,
                                                    create3dVector(middleX, middleY, middleZ),
                                                    this.startingLimit + this.limitIncreaseAmount,
                                                    this.fastMode,
                                                    this.limitIncreaseAmount,
                                                    this.depthLimit);
            }
            else if (position === TopRightFront) {
                this.children[position] = new Octree(create3dVector(middleX, this.topLeftFront.position.y, this.topLeftFront.position.z),
                                                create3dVector(this.bottomRightBack.position.x, middleY, middleZ),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }
            else if (position === BottomRightFront) {
                this.children[position] = new Octree(create3dVector(middleX, middleY, this.topLeftFront.position.z),
                                                create3dVector(this.bottomRightBack.position.x, this.bottomRightBack.position.y, middleZ),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }
            else if (position === BottomLeftFront) {
                this.children[position] = new Octree(create3dVector(this.topLeftFront.position.x, middleY, this.topLeftFront.position.z),
                                                create3dVector(middleX, this.bottomRightBack.position.y, middleZ),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }
            else if (position === TopLeftBottom) {
                this.children[position] = new Octree(create3dVector(this.topLeftFront.position.x, this.topLeftFront.position.y, middleZ),
                                                create3dVector(middleX, middleY, this.bottomRightBack.position.z),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }
            else if (position === TopRightBottom) {
                this.children[position] = new Octree(create3dVector(middleX, this.topLeftFront.position.y, middleZ),
                                                create3dVector(this.bottomRightBack.position.x, middleY, this.bottomRightBack.position.z),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }
            else if (position === BottomRightBack) {
                this.children[position] = new Octree(create3dVector(middleX, middleY, middleZ), this.bottomRightBack,
                                                    this.startingLimit + this.limitIncreaseAmount,
                                                    this.fastMode,
                                                    this.limitIncreaseAmount,
                                                    this.depthLimit);
            }
            else if (position === BottomLeftBack) {
                this.children[position] = new Octree(create3dVector(this.topLeftFront.position.x, middleY, middleZ),
                                                create3dVector(middleX, this.bottomRightBack.position.y, this.bottomRightBack.position.z),
                                                this.startingLimit + this.limitIncreaseAmount,
                                                this.fastMode,
                                                this.limitIncreaseAmount,
                                                this.depthLimit);
            }

            this.children[position].depth = this.depth + 1;
        }

        this.children[position].insert(vector);

        if (!this.fastMode) {
            // clear out this node as it is now subdivided
            const previousValues = this.values;
            this.values = [];

            for (let i = 0; i < previousValues.length; i++) {
                const currentValue = previousValues[i];
                this.insert(currentValue);
            }
        }
    }

    /**
     * 
     * @param {*} vector 
     * @returns boolean
     */
    find(vector) {
        if (!this.isPointInCube(vector, this.topLeftFront, this.bottomRightBack)) {
            return false;
        }

        if (!this.isSubdivided) {
            return this.values.indexOf(vector) !== -1;
        }

        const {
            position,
            middleX,
            middleY,
            middleZ
        } = this.getChildIndex(vector);

        const currentChild = this.children[position];

        // the child node is not in use
        if (currentChild === null) {
            return false;
        }
        // the child node has child nodes
        return currentChild.find(vector);
    }

    /**
     * detect unused child nodes
     * @returns boolean
     */
    hasChildren() {
        if (this.isSubdivided) {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i] !== null) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }

    isCubeIntersecting(topLeftFront, bottomRightBack, topLeftFrontBoundary, bottomRightBackBoundary) {
        return ((topLeftFront.position.x <= topLeftFrontBoundary.position.x && topLeftFrontBoundary.position.x <= bottomRightBack.position.x) || (topLeftFrontBoundary.position.x <= topLeftFront.position.x && topLeftFront.position.x <= bottomRightBackBoundary.position.x)) &&
            ((topLeftFront.position.y <= topLeftFrontBoundary.position.y && topLeftFrontBoundary.position.y <= bottomRightBack.position.y) || (topLeftFrontBoundary.position.y <= topLeftFront.position.y && topLeftFront.position.y <= bottomRightBackBoundary.position.y)) &&
            ((topLeftFront.position.z <= topLeftFrontBoundary.position.z && topLeftFrontBoundary.position.z <= bottomRightBack.position.z) || (topLeftFrontBoundary.position.z <= topLeftFront.position.z && topLeftFront.position.z <= bottomRightBackBoundary.position.z));
    }

    getAllVectors() {
        if (this.isSubdivided) {
            let totalVectors = [];

            for (let i = 0; i < this.children.length; i++) {
                const currentChild = this.children[i];
                if (currentChild !== null) {
                    totalVectors = [...totalVectors, ...currentChild.getAllVectors()];
                }
            }

            return totalVectors;
        }

        return this.values;
    }

    getVectors(topLeftFrontVector, bottomRightBackVector) {
        if (!this.isCubeIntersecting(topLeftFrontVector, bottomRightBackVector, this.topLeftFront, this.bottomRightBack)) {
            return [];
        }

        if (this.isSubdivided) {
            let totalVectors = [];

            for (let i = 0; i < this.children.length; i++) {
                const currentChild = this.children[i];
                if (currentChild !== null) {
                    totalVectors = [...totalVectors, ...currentChild.getVectors(topLeftFrontVector, bottomRightBackVector)];
                }
            }

            return totalVectors;
        }

        return this.values;
    }

    /**
     * depth first search
     * 
     * @param {*} topLeftFrontVector 
     * @param {*} bottomRightBackVector 
     * @returns array
     */
    getVectorsIterative(topLeftFrontVector, bottomRightBackVector) {
        let stack = [];
        stack.push(this);

        let totalVectors = [];

        while (stack.length !== 0) {
            const currentNode = stack.pop(); // dfs
            // const currentNode = stack.shift(); // bfs

            if (currentNode.isCubeIntersecting(topLeftFrontVector, bottomRightBackVector, currentNode.topLeftFront, currentNode.bottomRightBack)) {
                if (currentNode.isSubdivided) {
                    for (let i = 0; i < currentNode.children.length; i++) {
                        const currentChild = currentNode.children[i];
                        if (currentChild !== null) {
                            stack.push(currentChild);
                        }
                    }
                }
                else {
                    totalVectors = [...totalVectors, ...currentNode.values];
                }
            }
        }

        return totalVectors;
    }

    countVectors() {
        if (this.isSubdivided) {
            let total = 0;

            for (let i = 0; i < this.children.length; i++) {
                const currentChild = this.children[i];
                if (currentChild !== null) {
                    total += currentChild.countVectors();
                }
            }

            return total;
        }

        return this.values.length;
    }

    delete(vector) {
        if (!this.isPointInCube(vector, this.topLeftFront, this.bottomRightBack)) {
            return;
        }

        // the node has values
        if (!this.isSubdivided) {
            const index = this.values.indexOf(vector);

            if (index !== -1) {
                this.values.splice(index, 1);
            }

            return;
        }

        const {
            position,
            middleX,
            middleY,
            middleZ
        } = this.getChildIndex(vector);

        const currentChild = this.children[position];

        // the child node is holding a value or has children
        if (currentChild !== null) {
            currentChild.delete(vector);

            if (!this.fastMode) {
                // delete empty child nodes
                if (!currentChild.hasChildren()) {
                    this.children[position] = null;
                }

                if (!this.hasChildren()) {
                    this.isSubdivided = false;
                }
                else {
                    // reorder tree
                    if (this.countVectors() <= this.startingLimit) {
                        this.values = this.getAllVectors();
                        this.isSubdivided = false;

                        for (let i = 0; i < this.children.length; i++) {
                            this.children[i] = null;
                        }
                    }
                }
            }
        }
    }

    draw(drawAllRootOctants = false) {
        if (this.isSubdivided) {
            for (let i = 0; i < this.children.length; i++) {
                const currentChild = this.children[i];
                if (currentChild !== null) {
                    currentChild.draw();
                }
            }

            if (!drawAllRootOctants) {
                return;
            }
        }

        const {
            middleX,
            middleY,
            middleZ
        } = this.getMidpoints();
        const width = this.bottomRightBack.position.x - this.topLeftFront.position.x;
        const height = this.bottomRightBack.position.y - this.topLeftFront.position.y;
        const depth = this.bottomRightBack.position.z - this.topLeftFront.position.z;
        drawBox(middleX, middleY, middleZ, width, height, depth);
    }
}

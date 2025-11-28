// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from './chrome/assert.js';
import { FPS, IS_HIDPI } from './constants.js';
export class HorizonLine {
    canvasCtx;
    xPos;
    yPos = 0;
    bumpThreshold = 0.5;
    sourceXPos;
    spritePos;
    sourceDimensions;
    dimensions;
    imageSpriteProvider;
    /**
     * Horizon Line.
     * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
     */
    constructor(canvas, lineConfig, imageSpriteProvider) {
        let sourceX = lineConfig.sourceX;
        let sourceY = lineConfig.sourceY;
        if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
        }
        this.spritePos = { x: sourceX, y: sourceY };
        const canvasContext = canvas.getContext('2d');
        assert(canvasContext);
        this.canvasCtx = canvasContext;
        this.dimensions = { width: lineConfig.width, height: lineConfig.height };
        this.imageSpriteProvider = imageSpriteProvider;
        this.sourceXPos =
            [this.spritePos.x, this.spritePos.x + this.dimensions.width];
        this.xPos = [0, this.dimensions.width];
        this.yPos = lineConfig.yPos;
        this.sourceDimensions = {
            height: lineConfig.height,
            width: lineConfig.width,
        };
        if (IS_HIDPI) {
            this.sourceDimensions.width = lineConfig.width * 2;
            this.sourceDimensions.height = lineConfig.height * 2;
        }
        this.draw();
    }
    /**
     * Return the crop x position of a type.
     */
    getRandomType() {
        return Math.random() > this.bumpThreshold ? this.dimensions.width : 0;
    }
    /**
     * Draw the horizon line.
     */
    draw() {
        const runnerImageSprite = this.imageSpriteProvider.getRunnerImageSprite();
        assert(runnerImageSprite);
        this.canvasCtx.drawImage(runnerImageSprite, this.sourceXPos[0], this.spritePos.y, this.sourceDimensions.width, this.sourceDimensions.height, this.xPos[0], this.yPos, this.dimensions.width, this.dimensions.height);
        this.canvasCtx.drawImage(runnerImageSprite, this.sourceXPos[1], this.spritePos.y, this.sourceDimensions.width, this.sourceDimensions.height, this.xPos[1], this.yPos, this.dimensions.width, this.dimensions.height);
    }
    /**
     * Update the x position of an individual piece of the line.
     */
    updatexPos(pos, increment) {
        const line1 = pos;
        const line2 = pos === 0 ? 1 : 0;
        this.xPos[line1] -= increment;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.width;
        if (this.xPos[line1] <= -this.dimensions.width) {
            this.xPos[line1] += this.dimensions.width * 2;
            this.xPos[line2] = this.xPos[line1] - this.dimensions.width;
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
    }
    /**
     * Update the horizon line.
     */
    update(deltaTime, speed) {
        const increment = Math.floor(speed * (FPS / 1000) * deltaTime);
        this.updatexPos(this.xPos[0] <= 0 ? 0 : 1, increment);
        this.draw();
    }
    /**
     * Reset horizon to the starting position.
     */
    reset() {
        this.xPos[0] = 0;
        this.xPos[1] = this.dimensions.width;
    }
}
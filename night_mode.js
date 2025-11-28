// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { assert } from './chrome/assert.js';
import { IS_HIDPI } from './constants.js';
import { spriteDefinitionByType } from './offline_sprite_definitions.js';
import { getRandomNum } from './utils.js';
const PHASES = [140, 120, 100, 60, 40, 20, 0];
var Config;
(function (Config) {
    Config[Config["FADE_SPEED"] = 0.035] = "FADE_SPEED";
    Config[Config["HEIGHT"] = 40] = "HEIGHT";
    Config[Config["MOON_SPEED"] = 0.25] = "MOON_SPEED";
    Config[Config["NUM_STARS"] = 2] = "NUM_STARS";
    Config[Config["STAR_SIZE"] = 9] = "STAR_SIZE";
    Config[Config["STAR_SPEED"] = 0.3] = "STAR_SPEED";
    Config[Config["STAR_MAX_Y"] = 70] = "STAR_MAX_Y";
    Config[Config["WIDTH"] = 20] = "WIDTH";
})(Config || (Config = {}));
export class NightMode {
    spritePos;
    canvasCtx;
    xPos = 0;
    yPos = 30;
    currentPhase = 0;
    opacity = 0;
    containerWidth;
    stars = new Array(Config.NUM_STARS);
    drawStars = false;
    imageSpriteProvider;
    /**
     * Nightmode shows a moon and stars on the horizon.
     */
    constructor(canvas, spritePos, containerWidth, imageSpriteProvider) {
        this.spritePos = spritePos;
        this.imageSpriteProvider = imageSpriteProvider;
        const canvasContext = canvas.getContext('2d');
        assert(canvasContext);
        this.canvasCtx = canvasContext;
        this.containerWidth = containerWidth;
        this.placeStars();
    }
    /**
     * Update moving moon, changing phases.
     */
    update(activated) {
        // Moon phase.
        if (activated && this.opacity === 0) {
            this.currentPhase++;
            if (this.currentPhase >= PHASES.length) {
                this.currentPhase = 0;
            }
        }
        // Fade in / out.
        if (activated && (this.opacity < 1 || this.opacity === 0)) {
            this.opacity += Config.FADE_SPEED;
        }
        else if (this.opacity > 0) {
            this.opacity -= Config.FADE_SPEED;
        }
        // Set moon positioning.
        if (this.opacity > 0) {
            this.xPos = this.updateXpos(this.xPos, Config.MOON_SPEED);
            // Update stars.
            if (this.drawStars) {
                for (let i = 0; i < Config.NUM_STARS; i++) {
                    const star = this.stars[i];
                    assert(star);
                    star.x = this.updateXpos(star.x, Config.STAR_SPEED);
                }
            }
            this.draw();
        }
        else {
            this.opacity = 0;
            this.placeStars();
        }
        this.drawStars = true;
    }
    updateXpos(currentPos, speed) {
        if (currentPos < -Config.WIDTH) {
            currentPos = this.containerWidth;
        }
        else {
            currentPos -= speed;
        }
        return currentPos;
    }
    draw() {
        let moonSourceWidth = this.currentPhase === 3 ? Config.WIDTH * 2 : Config.WIDTH;
        let moonSourceHeight = Config.HEIGHT;
        const currentPhaseSpritePosition = PHASES[this.currentPhase];
        assert(currentPhaseSpritePosition !== undefined);
        let moonSourceX = this.spritePos.x + currentPhaseSpritePosition;
        const moonOutputWidth = moonSourceWidth;
        let starSize = Config.STAR_SIZE;
        let starSourceX = spriteDefinitionByType.original.ldpi.star.x;
        const runnerOrigImageSprite = this.imageSpriteProvider.getOrigImageSprite();
        assert(runnerOrigImageSprite);
        if (IS_HIDPI) {
            moonSourceWidth *= 2;
            moonSourceHeight *= 2;
            moonSourceX = this.spritePos.x + (currentPhaseSpritePosition * 2);
            starSize *= 2;
            starSourceX = spriteDefinitionByType.original.hdpi.star.x;
        }
        this.canvasCtx.save();
        this.canvasCtx.globalAlpha = this.opacity;
        // Stars.
        if (this.drawStars) {
            for (const star of this.stars) {
                this.canvasCtx.drawImage(runnerOrigImageSprite, starSourceX, star.sourceY, starSize, starSize, Math.round(star.x), star.y, Config.STAR_SIZE, Config.STAR_SIZE);
            }
        }
        // Moon.
        this.canvasCtx.drawImage(runnerOrigImageSprite, moonSourceX, this.spritePos.y, moonSourceWidth, moonSourceHeight, Math.round(this.xPos), this.yPos, moonOutputWidth, Config.HEIGHT);
        this.canvasCtx.globalAlpha = 1;
        this.canvasCtx.restore();
    }
    // Do star placement.
    placeStars() {
        const segmentSize = Math.round(this.containerWidth / Config.NUM_STARS);
        for (let i = 0; i < Config.NUM_STARS; i++) {
            const starPosition = {
                x: getRandomNum(segmentSize * i, segmentSize * (i + 1)),
                y: getRandomNum(0, Config.STAR_MAX_Y),
                sourceY: 0,
            };
            if (IS_HIDPI) {
                starPosition.sourceY = spriteDefinitionByType.original.hdpi.star.y +
                    Config.STAR_SIZE * 2 * i;
            }
            else {
                starPosition.sourceY =
                    spriteDefinitionByType.original.ldpi.star.y + Config.STAR_SIZE * i;
            }
            this.stars[i] = starPosition;
        }
    }
    reset() {
        this.currentPhase = 0;
        this.opacity = 0;
        this.update(false);
    }
}

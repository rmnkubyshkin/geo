import { ScatterplotLayer } from '@deck.gl/layers';

export class SquareScatterplotLayer extends ScatterplotLayer {
    getShaders() {
        const shaders = super.getShaders();
        return {
            ...shaders,
            fs: `#version 300 es
              precision highp float;
              in vec4 vFillColor;
              out vec4 fragColor;

              void main(void) {
                if (vFillColor.a == 0.0) discard;
                if (abs(gl_PointCoord.x - 0.5) > 0.5 || abs(gl_PointCoord.y - 0.5) > 0.5) {
                    discard;
                }
                fragColor = vFillColor;
              }
            `
        };
    }
}
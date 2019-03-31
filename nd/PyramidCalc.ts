/**
底边长 bottom length - L
斜面高 slope height - S
塔高   height - h
斜边长 hypotenuse length - hl
=>
2*L/h = math.PI
L*S /2 = h^2
S/(L/2) = 1.618
*/

class Pyramid {
  bottom: number;
  slopHeight: number;
  height: number;
  hypotenuse: number;
  angle: number;
  angle2: number;
  private precision: number = 3;

  /**
   *
   */
  constructor(width: number) {
    this.bottom = width;
  }

  calc(): void {
    // 2*L/h = math.PI
    this.height = (2 * this.bottom) / Math.PI;

    // L*S /2 = h^2
    // this.slopHeight = (this.height ** 2 * 2) / this.bottom;
    // S/(L/2) = 1.618
    this.slopHeight = 1.618 * (this.bottom / 2);
    // console.log(this.slopHeight)

    // according to The Pythagorean theorem
    // hl^2 = S^2 + (L/2)^2
    this.hypotenuse = Math.sqrt(this.slopHeight ** 2 + (this.bottom / 2) ** 2);

    this.angle = this.calcAngle(this.height / this.slopHeight);
    this.angle2 = this.calcAngle(this.slopHeight / this.hypotenuse);
  }

  private calcAngle(sinValue: number) {
    /**
     * formula:
     * double v = sin(0.3)
     * double v1= asin(v)
     * double v2 = v1/2/PI*360
     */
    return (Math.asin(sinValue) / 2 / Math.PI) * 360;
  }

  toString() {
    return `
    bottom: ${this.bottom.toFixed(this.precision)}
    height: ${this.height.toFixed(this.precision)}
    hypotenuse: ${this.hypotenuse.toFixed(this.precision)}
    slope-height: ${this.slopHeight.toFixed(this.precision)}
    angle: ${this.angle.toFixed(this.precision)}
    angle2: ${this.angle2.toFixed(this.precision)}
    `;
  }
}

if (process.argv.length === 3) {
  let width = parseInt(process.argv[2], 10);
  let pyr = new Pyramid(width);
  pyr.calc();
  console.log(pyr.toString());
} else {
  console.log("please follow bottom-width of your Pyramid to command");
}

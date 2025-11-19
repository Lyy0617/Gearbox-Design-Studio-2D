
/**
 * Generates an SVG path string for an involute-like gear profile.
 */
export const generateGearPath = (
  teeth: number,
  mod: number,
  holeRadius: number
): string => {
  const pitchRadius = (teeth * mod) / 2;
  const outerRadius = pitchRadius + 1 * mod;
  const innerRadius = pitchRadius - 1.25 * mod; 
  
  const numPoints = teeth * 4;
  const angleStep = (Math.PI * 2) / numPoints;
  
  let path = "";
  const toothWidthAngle = (Math.PI * 2) / teeth / 2; 
  const addendumFactor = 0.4; 
  
  for (let i = 0; i < teeth; i++) {
    const theta = (Math.PI * 2 * i) / teeth;
    
    const a1 = theta - toothWidthAngle / 2 - 0.05; 
    const a2 = theta - toothWidthAngle / 2 * addendumFactor;
    const a3 = theta + toothWidthAngle / 2 * addendumFactor;
    const a4 = theta + toothWidthAngle / 2 + 0.05;
    
    const p1 = polarToCartesian(innerRadius, a1);
    const p2 = polarToCartesian(outerRadius, a2);
    const p3 = polarToCartesian(outerRadius, a3);
    const p4 = polarToCartesian(innerRadius, a4);
    
    if (i === 0) {
        path += `M ${p1.x} ${p1.y}`;
    } else {
        path += ` L ${p1.x} ${p1.y}`;
    }
    path += ` L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y}`;
  }
  
  path += " Z";

  const holePath = createCirclePath(0, 0, holeRadius);
  
  return `${path} ${holePath}`;
};

export const polarToCartesian = (radius: number, angle: number) => {
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
};

export const createCirclePath = (cx: number, cy: number, r: number, clockwise = false) => {
  const d = r * 2;
  const sweep = clockwise ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy - r}`;
};

export const generateBearingPath = (outerR: number, innerR: number) => {
    const outer = createCirclePath(0, 0, outerR, true);
    const inner = createCirclePath(0, 0, innerR, false); 
    
    const avgR = (outerR + innerR) / 2;
    const ballR = (outerR - innerR) / 2.5;
    const numBalls = Math.floor((2 * Math.PI * avgR) / (ballR * 2.5));
    
    let balls = "";
    for(let i=0; i<numBalls; i++) {
        const angle = (Math.PI * 2 * i) / numBalls;
        const pos = polarToCartesian(avgR, angle);
        balls += ` M ${pos.x + ballR} ${pos.y} A ${ballR} ${ballR} 0 1 0 ${pos.x - ballR} ${pos.y} A ${ballR} ${ballR} 0 1 0 ${pos.x + ballR} ${pos.y}`;
    }

    return outer + inner + balls;
};

export const generateHelixLines = (radius: number, angle: number) => {
    let path = "";
    const count = 5;
    for(let i=0; i<count; i++) {
        const offset = (radius * 2) * (i/count) - radius;
        // Simple diagonal lines to suggest helix
        path += ` M ${-radius*0.6} ${offset - 10} L ${radius*0.6} ${offset + 10}`;
    }
    return path;
}

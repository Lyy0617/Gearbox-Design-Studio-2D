
export enum ComponentType {
  GEAR = 'GEAR',       // Spur Gear
  HELICAL = 'HELICAL', // Helical Gear
  BEVEL = 'BEVEL',     // Bevel Gear
  WORM = 'WORM',       // Worm Gear
  SHAFT = 'SHAFT',
  BEARING = 'BEARING',
  HOUSING = 'HOUSING',  // Housing Block/Mount
  COUPLING = 'COUPLING',
  SPACER = 'SPACER',
  CIRCLIP = 'CIRCLIP'
}

export enum BearingType {
  DEEP_GROOVE = 'DEEP_GROOVE',       // Deep Groove Ball
  ANGULAR_CONTACT = 'ANGULAR_CONTACT', // Angular Contact Ball
  CYLINDRICAL_ROLLER = 'CYLINDRICAL_ROLLER', // Cylindrical Roller
  TAPERED_ROLLER = 'TAPERED_ROLLER',   // Tapered Roller
  SELF_ALIGNING = 'SELF_ALIGNING',     // Self-aligning Ball/Roller
  THRUST = 'THRUST'     // Thrust Bearing
}

export interface BaseComponent {
  id: string;
  type: ComponentType;
  x: number; // X Position (Axial)
  y: number; // Y Position (Transverse / Shaft Axis)
  rotation: number;
  selected: boolean;
}

export interface GearComponent extends BaseComponent {
  type: ComponentType.GEAR | ComponentType.HELICAL | ComponentType.BEVEL;
  params: {
    teeth: number;
    module: number;
    pressureAngle: number;
    holeDiameter: number;
    thickness: number; 
    helixAngle?: number; // For Helical
    color: string;
  };
}

export interface WormComponent extends BaseComponent {
  type: ComponentType.WORM;
  params: {
    length: number;
    diameter: number;
    module: number;
    color: string;
  };
}

export interface ShaftSegment {
  id: string;
  length: number;
  diameter: number;
}

export interface ShaftComponent extends BaseComponent {
  type: ComponentType.SHAFT;
  params: {
    segments: ShaftSegment[];
    color: string;
  };
}

export interface BearingComponent extends BaseComponent {
  type: ComponentType.BEARING;
  params: {
    subtype: BearingType;
    width: number;
    outerDiameter: number;
    innerDiameter: number;
    color: string;
  };
}

export interface HousingComponent extends BaseComponent {
  type: ComponentType.HOUSING;
  params: {
    width: number;
    height: number;
    color: string;
  };
}

export interface SimplePartComponent extends BaseComponent {
  type: ComponentType.COUPLING | ComponentType.SPACER | ComponentType.CIRCLIP;
  params: {
    width: number; // Axial length
    outerDiameter: number;
    innerDiameter: number; // For visualization of hole
    color: string;
  };
}

export type GearboxItem = GearComponent | ShaftComponent | BearingComponent | HousingComponent | WormComponent | SimplePartComponent;

export interface ViewPort {
  x: number;
  y: number;
  zoom: number;
}

export const SNAP_GRID = 10;

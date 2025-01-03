export type EquipmentCategory = 
  | 'guitars'
  | 'bass'
  | 'drums'
  | 'keys'
  | 'vocals'
  | 'equipment'
  | 'monitors';

export type EquipmentType = {
  id: string;
  category: EquipmentCategory;
  label: string;
  svgFile: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultTechnicalRequirements?: string[];
};

export const EQUIPMENT_MAP: Record<string, EquipmentType> = {
  electric_guitar: {
    id: 'electric_guitar',
    category: 'guitars',
    label: 'Electric Guitar',
    svgFile: '/images/stageicons/eguitar.svg',
    defaultWidth: 15,
    defaultHeight: 15,
    defaultTechnicalRequirements: ['DI Box', 'XLR Cable', '1/4" Cable']
  },
  acoustic_guitar: {
    id: 'acoustic_guitar',
    category: 'guitars',
    label: 'Acoustic Guitar',
    svgFile: '/images/stageicons/classicalguitar.svg',
    defaultWidth: 15,
    defaultHeight: 15,
    defaultTechnicalRequirements: ['DI Box', 'XLR Cable', '1/4" Cable']
  },
  electric_bass: {
    id: 'electric_bass',
    category: 'bass',
    label: 'Electric Bass',
    svgFile: '/images/stageicons/bass.svg',
    defaultWidth: 15,
    defaultHeight: 15,
    defaultTechnicalRequirements: ['DI Box', 'XLR Cable', '1/4" Cable']
  },
  upright_bass: {
    id: 'upright_bass',
    category: 'bass',
    label: 'Upright Bass',
    svgFile: '/images/stageicons/contrabass.svg',
    defaultWidth: 20,
    defaultHeight: 20,
    defaultTechnicalRequirements: ['DI Box', 'XLR Cable']
  },
  drum_kit: {
    id: 'drum_kit',
    category: 'drums',
    label: 'Drum Kit',
    svgFile: '/images/stageicons/drumkitb.svg',
    defaultWidth: 30,
    defaultHeight: 30,
    defaultTechnicalRequirements: ['Kick Mic', 'Snare Mic', 'Tom Mics', 'Overhead Mics']
  },
  congas: {
    id: 'congas',
    category: 'drums',
    label: 'Congas',
    svgFile: '/images/stageicons/congas.svg',
    defaultWidth: 15,
    defaultHeight: 15,
    defaultTechnicalRequirements: ['Microphone']
  },
  keyboard: {
    id: 'keyboard',
    category: 'keys',
    label: 'Keyboard',
    svgFile: '/images/stageicons/keyboarda.svg',
    defaultWidth: 25,
    defaultHeight: 15,
    defaultTechnicalRequirements: ['DI Box', 'Power Supply']
  },
  piano: {
    id: 'piano',
    category: 'keys',
    label: 'Piano',
    svgFile: '/images/stageicons/pianoa.svg',
    defaultWidth: 35,
    defaultHeight: 25,
    defaultTechnicalRequirements: ['Piano Mics']
  },
  microphone: {
    id: 'microphone',
    category: 'vocals',
    label: 'Microphone',
    svgFile: '/images/stageicons/microphone2.svg',
    defaultWidth: 10,
    defaultHeight: 10,
    defaultTechnicalRequirements: ['XLR Cable']
  },
  microphone_stand: {
    id: 'microphone_stand',
    category: 'vocals',
    label: 'Microphone with Stand',
    svgFile: '/images/stageicons/microphone.svg',
    defaultWidth: 10,
    defaultHeight: 20,
    defaultTechnicalRequirements: ['XLR Cable', 'Mic Stand']
  },
  guitar_amp: {
    id: 'guitar_amp',
    category: 'equipment',
    label: 'Guitar Amp',
    svgFile: '/images/stageicons/combo.svg',
    defaultWidth: 20,
    defaultHeight: 20,
    defaultTechnicalRequirements: ['Power Supply', 'Microphone']
  },
  bass_amp: {
    id: 'bass_amp',
    category: 'equipment',
    label: 'Bass Amp',
    svgFile: '/images/stageicons/basscombo.svg',
    defaultWidth: 20,
    defaultHeight: 20,
    defaultTechnicalRequirements: ['Power Supply', 'DI Box']
  },
  di_box: {
    id: 'di_box',
    category: 'equipment',
    label: 'DI Box',
    svgFile: '/images/stageicons/dibox.svg',
    defaultWidth: 10,
    defaultHeight: 10,
    defaultTechnicalRequirements: ['XLR Cable']
  },
  monitor_left: {
    id: 'monitor_left',
    category: 'monitors',
    label: 'Monitor Wedge (Left)',
    svgFile: '/images/stageicons/monitor2.svg',
    defaultWidth: 15,
    defaultHeight: 10
  },
  monitor_right: {
    id: 'monitor_right',
    category: 'monitors',
    label: 'Monitor Wedge (Right)',
    svgFile: '/images/stageicons/monitor.svg',
    defaultWidth: 15,
    defaultHeight: 10
  }
}; 
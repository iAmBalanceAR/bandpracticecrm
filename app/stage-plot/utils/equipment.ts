import { EquipmentType, EquipmentCategory, EQUIPMENT_MAP } from '../types/equipment';

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  guitars: 'Guitars',
  bass: 'Bass',
  drums: 'Drums & Percussion',
  keys: 'Keys',
  vocals: 'Vocals',
  equipment: 'Equipment',
  monitors: 'Monitors'
};

export function getEquipmentByCategory() {
  const grouped = Object.values(EQUIPMENT_MAP).reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<EquipmentCategory, EquipmentType[]>);

  // Sort items within each category by label
  Object.keys(grouped).forEach(category => {
    grouped[category as EquipmentCategory].sort((a, b) => a.label.localeCompare(b.label));
  });

  return grouped;
}

export function getEquipmentById(id: string): EquipmentType | undefined {
  return EQUIPMENT_MAP[id];
}

export function createNewStageItem(equipmentId: string, position = { x: 50, y: 50 }) {
  const equipment = getEquipmentById(equipmentId);
  if (!equipment) return null;

  return {
    id: crypto.randomUUID(),
    stage_plot_id: '',
    equipment_id: equipmentId,
    position_x: position.x,
    position_y: position.y,
    width: equipment.defaultWidth,
    height: equipment.defaultHeight,
    rotation: 0,
    technical_requirements: equipment.defaultTechnicalRequirements?.reduce((acc, req) => {
      acc[req] = [];
      return acc;
    }, {} as Record<string, string[]>) || {},
    created_at: new Date().toISOString()
  };
} 
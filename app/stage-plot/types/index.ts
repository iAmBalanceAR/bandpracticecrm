export interface StagePlot {
  id: string
  user_id: string
  name: string
  stage_width: number
  stage_depth: number
  created_at: string
  updated_at: string
}

export interface StagePlotItem {
  id: string
  stage_plot_id: string
  equipment_id: string
  position_x: number
  position_y: number
  width: number
  height: number
  rotation: number
  technical_requirements: {
    [key: string]: string[]
  }
  customLabel?: string
  showLabel?: boolean
  created_at: string
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface DraggableItemProps {
  id: string
  position: Position
  size: Size
  rotation: number
  onPositionChange: (id: string, position: Position) => void
  onSizeChange: (id: string, size: Size) => void
  onRotationChange: (id: string, rotation: number) => void
  children: React.ReactNode
} 
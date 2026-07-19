import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Children, isValidElement, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Grid analogue of SortableRows: drag-to-reorder over a wrapping grid of
 * cards. Children must be <SortableGridItem id=…> and the parent supplies the
 * grid layout classes via `className`.
 */
export function SortableGrid({
  ids,
  disabled = false,
  onMove,
  className,
  children,
}: {
  ids: number[]
  disabled?: boolean
  onMove: (from: number, to: number) => void
  className?: string
  children: React.ReactNode
}) {
  // Applied synchronously on drop so the item doesn't flash back to its old
  // position while the optimistic cache update propagates. Cleared once `ids`
  // catches up.
  const [droppedOrder, setDroppedOrder] = useState<number[] | null>(null)
  const idsKey = ids.join(',')
  useEffect(() => {
    setDroppedOrder(null)
  }, [idsKey])
  const order = droppedOrder ?? ids

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(active.id as number)
    const to = ids.indexOf(over.id as number)
    setDroppedOrder(arrayMove(ids, from, to))
    onMove(from, to)
  }

  const itemsById = new Map<number, React.ReactNode>()
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ id: number }>(child)) itemsById.set(child.props.id, child)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={disabled ? undefined : handleDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy} disabled={disabled}>
        <div className={className}>{order.map((id) => itemsById.get(id))}</div>
      </SortableContext>
    </DndContext>
  )
}

export function SortableGridItem({
  id,
  disabled = false,
  className,
  children,
}: {
  id: number
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'touch-none',
        !disabled && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
        isDragging && 'z-10 opacity-80',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

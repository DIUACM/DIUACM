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
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
} from 'react'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const DisabledContext = createContext(false)

export function SortableRows({
  ids,
  disabled = false,
  onMove,
  children,
}: {
  ids: number[]
  disabled?: boolean
  onMove: (from: number, to: number) => void
  children: React.ReactNode
}) {
  // The dropped order, applied synchronously so the row doesn't flash back to
  // its old position for a frame while the optimistic cache update propagates
  // through react-query's batched notifications. Cleared once `ids` catches up.
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

  const rowsById = new Map<number, React.ReactNode>()
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ id: number }>(child)) rowsById.set(child.props.id, child)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      // The a11y live region is a <div>; portal it to <body> so it doesn't
      // end up as an invalid child of <table>.
      accessibility={{ container: document.body }}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <DisabledContext.Provider value={disabled}>
          <TableBody>{order.map((id) => rowsById.get(id))}</TableBody>
        </DisabledContext.Provider>
      </SortableContext>
    </DndContext>
  )
}

export function SortableRow({
  id,
  children,
}: {
  id: number
  children: React.ReactNode
}) {
  const disabled = useContext(DisabledContext)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 bg-muted')}
    >
      <TableCell>
        <button
          type="button"
          aria-label="Drag to reorder"
          disabled={disabled}
          className={cn(
            'flex touch-none items-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            disabled
              ? 'cursor-default opacity-40'
              : isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab',
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  )
}

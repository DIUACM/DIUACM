import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/client'
import { useMarkAttendance } from '@/api/queries/events'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AttendanceDialog({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const markAttendance = useMarkAttendance(eventId)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    markAttendance.mutate(password, {
      onSuccess: () => {
        toast.success('Attendance recorded!')
        setOpen(false)
        setPassword('')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Mark attendance</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark attendance</DialogTitle>
          <DialogDescription>
            Enter the event password shared by the organizers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-password">Event password</Label>
            <Input
              id="event-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={markAttendance.isPending || password.length === 0}
            >
              {markAttendance.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

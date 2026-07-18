import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ApiError, api, errorMessage, unwrap } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from './GoogleSignInButton'
import { useAuth } from './auth-context'
import { useDocumentTitle } from '@/lib/use-document-title'

interface FormState {
  name: string
  email: string
  username: string
  password: string
  studentId: string
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  username: '',
  password: '',
  studentId: '',
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
    errors.username = '3–30 characters; letters, digits, and underscores only'
  }
  if (form.password.length < 8) {
    errors.password = 'At least 8 characters'
  }
  return errors
}

export function RegisterPage() {
  useDocumentTitle('Register')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const registerMutation = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/auth/register', {
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            username: form.username,
            password: form.password,
            studentId: form.studentId.trim() || undefined,
          },
        }),
      ),
    onSuccess: (auth) => {
      login(auth)
      toast.success(`Welcome to DIU ACM, ${auth.user.name}!`)
      navigate('/')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.issues.length > 0) {
        const fieldErrors: Partial<Record<keyof FormState, string>> = {}
        for (const field of ['name', 'email', 'username', 'password', 'studentId'] as const) {
          const message = error.issueFor(field)
          if (message) fieldErrors[field] = message
        }
        setErrors(fieldErrors)
      }
      toast.error(errorMessage(error))
    },
  })

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    registerMutation.mutate()
  }

  const field = (
    id: keyof FormState,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={form[id]}
        onChange={set(id)}
        aria-invalid={Boolean(errors[id])}
        {...props}
      />
      {errors[id] && <p className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  )

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Join the DIU ACM community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {field('name', 'Full name', { autoComplete: 'name', required: true })}
            {field('email', 'Email', {
              type: 'email',
              autoComplete: 'email',
              required: true,
            })}
            {field('username', 'Username', {
              autoComplete: 'username',
              required: true,
            })}
            {field('password', 'Password', {
              type: 'password',
              autoComplete: 'new-password',
              required: true,
            })}
            {field('studentId', 'Student ID (optional)')}
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating account…' : 'Register'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

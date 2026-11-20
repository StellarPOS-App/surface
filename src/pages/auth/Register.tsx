import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuthStore } from '@/stores/authStore';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(100),
    email: z.string().trim().email('That does not look like an email'),
    password: z.string().min(8, 'Use at least 8 characters').max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
type Form = z.infer<typeof schema>;

export default function Register() {
  const registerUser = useAuthStore((s) => s.register);
  const serverError = useAuthStore((s) => s.error);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      await registerUser({ name, email, password });
      navigate('/pos', { replace: true });
    } catch {
      // Message comes from the store.
    }
  });

  return (
    <>
      <h2 className="font-display text-4xl font-extrabold tracking-tight">Create an account</h2>
      <p className="mt-2 text-ink-2">
        The first account on a new store becomes its owner (admin). Later sign-ups join as cashiers.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        {serverError && (
          <p role="alert" className="rounded-lg bg-signal-soft px-3 py-2 text-sm text-signal">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-3">
        Already have one?{' '}
        <Link to="/auth/login" className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}

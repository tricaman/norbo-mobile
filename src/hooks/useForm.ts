import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm as useRHFForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType } from 'zod';

interface UseFormEnhancedProps<TValues extends FieldValues>
  extends Omit<UseFormProps<TValues>, 'resolver'> {
  schema: ZodType<TValues>;
}

export function useForm<TValues extends FieldValues>({
  schema,
  ...props
}: UseFormEnhancedProps<TValues>): UseFormReturn<TValues> {
  return useRHFForm<TValues>({
    ...props,
    resolver: zodResolver(schema),
  });
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { pickBy } from 'lodash';
import posthog from 'posthog-js';
import { KeyboardEvent, useCallback, useEffect } from 'react';
import { useForm, type ControllerRenderProps, type UseFormReturn } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import CharactersLeft from '@/components/CharactersLeft';
import StatusSelect from '@/components/Presence/StatusSelect';

import useConfetti from '@/hooks/useConfetti';
import useSoundEffects from '@/hooks/useSoundEffects';
import useUserData from '@/hooks/useUserData';

import { MAX_UPDATE_LENGTH } from '@/config';
import { DEFAULT_STATUS } from '@/statusOptions';
import { cn } from '@/lib/utils';

import type { User } from '@/lib/types';

const statusFormSchema = z.object({
  update: z
    .string()
    .max(MAX_UPDATE_LENGTH, {
      message: `Max update length is ${MAX_UPDATE_LENGTH} characters.`,
    })
    .optional(),
  status: z.string().optional(),
});
type StatusFormValues = z.infer<typeof statusFormSchema>;

type Props = {
  className?: string;
};

export type StatusUpdateForm = UseFormReturn<
  { update: string; status: string | undefined },
  any,
  undefined
>;
export type StatusUpdateFormField<T extends 'update' | 'status'> = ControllerRenderProps<
  { update: string; status: string | undefined },
  T
>;

export default function StatusUpdate({ className }: Props) {
  const { playUserUpdatePosted } = useSoundEffects();
  const { updateUser, user } = useUserData();
  const status = user?.status || DEFAULT_STATUS;
  const form = useForm({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      update: '',
      status: user?.status,
    },
  });
  const { shootConfetti } = useConfetti();
  const update = form.watch('update');

  useHotkeys(
    '/',
    () => {
      form.setFocus('update');
    },
    { preventDefault: true }
  );

  useEffect(() => {
    form.setValue('status', status);
  }, [form, status]);

  const onSubmit = useCallback(
    (values: StatusFormValues) => {
      if (!user) return;
      const now = new Date();

      const updatedValues: Partial<StatusFormValues> = pickBy(
        values,
        (_: any, key: keyof typeof values) => form.formState.dirtyFields?.[key]
      );

      const updatedData: Partial<User> = {
        ...updatedValues,
      };

      if (updatedData.update) updatedData.updateChangedAt = now;
      if (updatedData.status) updatedData.statusChangedAt = now;

      updateUser({ data: updatedData });

      form.reset({ status: values.status, update: '' });

      if (updatedValues.update) {
        playUserUpdatePosted();
        shootConfetti({ source: 'status update' });

        if (updatedValues.status)
          posthog.capture('Status update (combo)', {
            updateLength: updatedValues.update.length,
            status: updatedValues.status,
          });
        else
          posthog.capture('Status update (update)', {
            updateLength: updatedValues?.update?.length,
          });
      } else
        posthog.capture('Status update (status)', {
          status: updatedValues.status,
        });
    },
    [form, playUserUpdatePosted, shootConfetti, updateUser, user]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement | HTMLButtonElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();

        if (form.formState.isDirty) form.handleSubmit(onSubmit)();
      }
    },
    [form, onSubmit]
  );

  return (
    <div className={cn('pb-8', className)}>
      <h2 className='text-lg sm:text-xl font-header font-bold pb-2'>Status Update</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className='flex flex-col gap-4'>
            <div>
              <FormField
                control={form.control}
                name='update'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className='bg-white min-h-[1em] [field-sizing:content]'
                        onKeyDown={handleKeyDown}
                        placeholder={`what's happening?`}
                        maxLength={MAX_UPDATE_LENGTH}
                        autoFocus
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-row justify-between items-center'>
              <div>
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormControl>
                      <StatusSelect
                        field={field}
                        form={form}
                        selectedStatus={form.watch('status') || DEFAULT_STATUS}
                        handleKeyDown={handleKeyDown}
                      />
                    </FormControl>
                  )}
                />
              </div>
              <CharactersLeft monitor={update} maxLength={MAX_UPDATE_LENGTH} className='w-full' />
              <Button variant='outline' type='submit' disabled={!form.formState.isDirty}>
                Post
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

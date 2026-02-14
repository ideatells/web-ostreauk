import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Translations } from "@/lib/i18n"
import { createContactSubmission } from "@/lib/strapi"

interface ContactFormProps {
  locale: "nl" | "en"
  translations: Translations["form"]
}

function buildSchema(translations: Translations["form"]) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, translations.required)
      .min(2, translations.minLength.replace("{n}", "2")),
    email: z
      .string()
      .trim()
      .min(1, translations.required)
      .email(translations.invalidEmail),
    phone: z.string().trim().optional(),
    message: z
      .string()
      .trim()
      .min(1, translations.required)
      .min(10, translations.minLength.replace("{n}", "10")),
  })
}

type ContactFormValues = z.infer<ReturnType<typeof buildSchema>>

export default function ContactForm({ locale, translations }: ContactFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const schema = buildSchema(translations)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  })

  async function onSubmit(values: ContactFormValues) {
    setSubmitError(null)

    try {
      await createContactSubmission({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        message: values.message,
      })
      window.location.href = `/${locale}/bedankt`
    } catch {
      setSubmitError(translations.submitError)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.name}</FormLabel>
              <FormControl>
                <Input type="text" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.email}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.phone}</FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.message}</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? translations.submitting : translations.submit}
        </Button>
      </form>
    </Form>
  )
}

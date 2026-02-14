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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Translations } from "@/lib/i18n"
import { createIntakeSubmission } from "@/lib/strapi"

interface IntakeFormProps {
  locale: "nl" | "en"
  translations: Translations["form"]
  serviceTypeTranslations: Translations["serviceType"]
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
    company_name: z.string().trim().optional(),
    service_type: z
      .enum(["bedrijfsjuristen", "trust_formation", "belastingadvies"])
      .optional(),
    message: z.string().trim().optional(),
  })
}

type IntakeFormValues = z.infer<ReturnType<typeof buildSchema>>

export default function IntakeForm({
  locale,
  translations,
  serviceTypeTranslations,
}: IntakeFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const schema = buildSchema(translations)

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company_name: "",
      service_type: undefined,
      message: "",
    },
  })

  async function onSubmit(values: IntakeFormValues) {
    setSubmitError(null)

    try {
      await createIntakeSubmission({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        company_name: values.company_name || undefined,
        service_type: values.service_type,
        message: values.message || undefined,
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
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.companyName}</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.serviceType}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.serviceType} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bedrijfsjuristen">
                    {serviceTypeTranslations.bedrijfsjuristen}
                  </SelectItem>
                  <SelectItem value="trust_formation">
                    {serviceTypeTranslations.trust_formation}
                  </SelectItem>
                  <SelectItem value="belastingadvies">
                    {serviceTypeTranslations.belastingadvies}
                  </SelectItem>
                </SelectContent>
              </Select>
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitSupportEnquiry } from "@/lib/api/client";
import type { WebContentPageResponse } from "@/lib/api/types";

const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  message: z.string().min(12, "Please add a bit more detail")
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm({ page }: { page: WebContentPageResponse }) {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      city: "Bengaluru",
      message: ""
    }
  });

  const supportMutation = useMutation({
    mutationFn: (values: ContactValues) =>
      submitSupportEnquiry({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        city: values.city?.trim() || undefined,
        message: values.message
      }),
    onSuccess: () => {
      form.reset({
        fullName: "",
        email: "",
        phoneNumber: "",
        city: "Bengaluru",
        message: ""
      });
    }
  });

  const onSubmit = form.handleSubmit((values) => supportMutation.mutate(values));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.08fr]">
      <div className="grid gap-6">
        <div className="hero-panel px-6 py-8 md:px-8 md:py-9">
          <div className="relative z-10">
            <span className="eyebrow-pill">{page.eyebrow}</span>
            <h2 className="mt-6 font-serif text-4xl leading-tight text-oat md:text-5xl">
              {page.title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-oat/76">{page.description}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {page.sections.map((section) => (
            <div className="section-panel" key={section.heading}>
              <h3 className="text-lg font-semibold text-ink">{section.heading}</h3>
              <p className="mt-2 text-sm leading-7 text-ink/72">{section.body}</p>
              {section.bullets.length ? (
                <ul className="mt-4 grid gap-2">
                  {section.bullets.map((bullet) => (
                    <li className="soft-panel px-4 py-3 text-sm text-ink/74" key={bullet}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <form
        className="section-panel"
        onSubmit={onSubmit}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Contact support
            </p>
            <h3 className="mt-3 font-serif text-3xl text-ink">Send a message and we’ll follow up</h3>
          </div>
          <span className="meta-pill">Support workflow</span>
        </div>

        <div className="grid gap-4">
          <label className="field-label mt-6">
            Full name
            <input className="form-control mt-2" {...form.register("fullName")} />
            <span className="mt-2 block text-xs text-copper">{form.formState.errors.fullName?.message}</span>
          </label>
          <label className="field-label">
            Email
            <input className="form-control mt-2" {...form.register("email")} />
            <span className="mt-2 block text-xs text-copper">{form.formState.errors.email?.message}</span>
          </label>
          <label className="field-label">
            Phone number
            <input className="form-control mt-2" {...form.register("phoneNumber")} />
          </label>
          <label className="field-label">
            City
            <input className="form-control mt-2" {...form.register("city")} />
          </label>
          <label className="field-label">
            Message
            <textarea className="form-control mt-2 min-h-36" {...form.register("message")} />
            <span className="mt-2 block text-xs text-copper">{form.formState.errors.message?.message}</span>
          </label>
          <button className="button-primary" disabled={supportMutation.isPending} type="submit">
            {supportMutation.isPending ? "Submitting..." : "Submit enquiry"}
          </button>
          {supportMutation.data ? (
            <p className="rounded-[24px] bg-pine/10 px-4 py-3 text-sm text-pine">
              {supportMutation.data.message} Enquiry ID: {supportMutation.data.enquiryId}
            </p>
          ) : null}
          {supportMutation.error ? (
            <p className="rounded-[24px] bg-copper/10 px-4 py-3 text-sm text-copper">
              Support submission did not go through. Please try again in a moment.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

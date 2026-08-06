"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ContactForm({ onSuccess, className }: ContactFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale") || "fr";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const t = {
    fr: {
      firstName: "Prénom",
      lastName: "Nom",
      email: "Email",
      company: "Entreprise",
      subject: "Sujet",
      message: "Message",
      submit: "Envoyer",
      submitting: "Envoi en cours...",
      success: "Message envoyé avec succès !",
      error: "Erreur lors de l'envoi. Réessayez plus tard.",
      required: "Ce champ est requis",
      invalidEmail: "Email invalide",
    },
    en: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      company: "Company",
      subject: "Subject",
      message: "Message",
      submit: "Send",
      submitting: "Sending...",
      success: "Message sent successfully!",
      error: "Error sending message. Please try again later.",
      required: "This field is required",
      invalidEmail: "Invalid email",
    },
  }[locale as "fr" | "en"] || {
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    company: "Entreprise",
    subject: "Sujet",
    message: "Message",
    submit: "Envoyer",
    submitting: "Envoi en cours...",
    success: "Message envoyé avec succès !",
    error: "Erreur lors de l'envoi. Réessayez plus tard.",
    required: "Ce champ est requis",
    invalidEmail: "Email invalide",
  };

  const validateField = (name: string, value: string) => {
    if (!value.trim()) return t.required;
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t.invalidEmail;
    }
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSubmitStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });
      onSuccess?.();
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects =
    locale === "fr"
      ? [
          "Nouveau projet",
          "Partenariat",
          "Presse / Médias",
          "Carrières",
          "Autre",
        ]
      : ["New project", "Partnership", "Press / Media", "Careers", "Other"];

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            {t.firstName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.firstName ? "border-red-500" : "border-border"
            }`}
            placeholder={t.firstName}
            aria-invalid={errors.firstName ? "true" : "false"}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
          />
          {errors.firstName && (
            <p
              id="firstName-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            {t.lastName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.lastName ? "border-red-500" : "border-border"
            }`}
            placeholder={t.lastName}
            aria-invalid={errors.lastName ? "true" : "false"}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
          />
          {errors.lastName && (
            <p
              id="lastName-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t.email} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            errors.email ? "border-red-500" : "border-border"
          }`}
          placeholder={t.email}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p
            id="email-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-1">
          {t.company}
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder={t.company}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1">
          {t.subject} <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            errors.subject ? "border-red-500" : "border-border"
          }`}
          aria-invalid={errors.subject ? "true" : "false"}
          aria-describedby={errors.subject ? "subject-error" : undefined}
        >
          <option value="">
            {locale === "fr"
              ? "-- Choisissez un sujet --"
              : "-- Choose a subject --"}
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p
            id="subject-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          {t.message} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${
            errors.message ? "border-red-500" : "border-border"
          }`}
          placeholder={t.message}
          aria-invalid={errors.message ? "true" : "false"}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p
            id="message-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.message}
          </p>
        )}
      </div>

      {submitStatus === "error" && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          role="alert"
        >
          {errorMessage || t.error}
        </div>
      )}

      {submitStatus === "success" && (
        <div
          className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
          role="status"
        >
          {t.success}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}

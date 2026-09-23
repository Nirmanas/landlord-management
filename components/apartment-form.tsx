"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import {
  apartmentFormSchema,
  type ApartmentFormValues,
} from "@/lib/apartment-schema";
import { landlordRoutes } from "@/lib/routes";
import type { Apartment } from "@/lib/types";

export function ApartmentForm({ apartment }: { apartment?: Apartment }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentFormSchema),
    defaultValues: {
      name: apartment?.name ?? "",
      address: apartment?.address ?? "",
    },
  });

  function onSubmit() {
    // Temporary navigation until apartment persistence is connected.
    router.push(
      apartment
        ? landlordRoutes.apartment(apartment.id)
        : landlordRoutes.apartments,
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Property information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Apartment name"
            htmlFor="name"
            error={errors.name?.message}
          >
            <Input
              id="name"
              {...register("name")}
              required
              placeholder="Apartment name"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field
            label="Street address"
            htmlFor="address"
            error={errors.address?.message}
          >
            <Input
              id="address"
              {...register("address")}
              required
              placeholder="Street address"
              aria-invalid={Boolean(errors.address)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link
          href={
            apartment
              ? landlordRoutes.apartment(apartment.id)
              : landlordRoutes.apartments
          }
        >
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {apartment ? "Save changes" : "Create apartment"}
        </Button>
      </div>
    </form>
  );
}

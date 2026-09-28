"use client";

import type { FormAction } from "@/lib/form-state";
import { CATEGORIES } from "@/lib/categories";
import { ActionForm, CheckboxField, Row, SelectField, TextArea, TextField } from "./form";
import { sectionTitle } from "@/components/ui/styles";

export type ExperienceValues = {
  title: string;
  category: string;
  area_id: string;
  summary: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  is_group_price: boolean;
  min_people: number;
  max_people: number;
  included: string[];
  what_to_bring: string[];
  meeting_point: string;
  meeting_point_map_url: string | null;
  operator_cancellation_terms: string | null;
};

const rands = (cents?: number) => (cents == null ? "" : cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));

/** Create/edit an experience's details. Photos and times are managed separately on the edit page. */
export function ExperienceForm({
  action,
  areas,
  experience,
  submitLabel,
}: {
  action: FormAction;
  areas: { id: string; name: string }[];
  experience?: ExperienceValues;
  submitLabel: string;
}) {
  const e = experience;
  const h = "mb-3 mt-2 border-t border-line pt-5 first:mt-0 first:border-0 first:pt-0";
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <h2 className={`${sectionTitle} ${h}`}>The basics</h2>
      <TextField name="title" label="Title" defaultValue={e?.title} placeholder="e.g. Sunset game drive in Addo" />
      <Row>
        <SelectField
          name="category"
          label="Category"
          placeholder="Choose one"
          options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          defaultValue={e?.category}
        />
        <SelectField
          name="areaId"
          label="Area"
          placeholder="Choose the area"
          options={areas.map((a) => ({ value: a.id, label: a.name }))}
          defaultValue={e?.area_id}
        />
      </Row>
      <TextField name="summary" label="One-line summary" defaultValue={e?.summary} hint="Shown on cards. 10–160 characters." />
      <TextArea
        name="description"
        label="Description"
        rows={7}
        defaultValue={e?.description}
        hint="What happens, what guests will see, what makes it special. Plain, friendly language."
      />

      <h2 className={`${sectionTitle} ${h}`}>Price and group size</h2>
      <Row>
        <TextField name="price" label="Price" prefix="R" inputMode="decimal" defaultValue={rands(e?.price_cents)} hint="Your normal price, the same as booking with you directly." />
        <TextField name="durationMinutes" label="Length (minutes)" inputMode="numeric" defaultValue={e?.duration_minutes} hint="e.g. 180 for 3 hours" />
      </Row>
      <CheckboxField name="isGroupPrice" defaultChecked={e?.is_group_price} label="This price is for the whole group (e.g. a private charter), not per person" />
      <Row>
        <TextField name="minPeople" label="Minimum people" inputMode="numeric" defaultValue={e?.min_people ?? 1} />
        <TextField name="maxPeople" label="Maximum people per booking" inputMode="numeric" defaultValue={e?.max_people} />
      </Row>

      <h2 className={`${sectionTitle} ${h}`}>On the day</h2>
      <TextField name="meetingPoint" label="Meeting point" defaultValue={e?.meeting_point} placeholder="e.g. Addo Main Gate reception" />
      <TextField name="meetingPointMapUrl" label="Map link (optional)" inputMode="url" defaultValue={e?.meeting_point_map_url} placeholder="Google Maps link" />
      <Row>
        <TextArea name="included" label="What's included" rows={4} defaultValue={e?.included.join("\n")} hint="One per line" />
        <TextArea name="whatToBring" label="What to bring" rows={4} defaultValue={e?.what_to_bring.join("\n")} hint="One per line" />
      </Row>
      <TextArea
        name="cancellationTerms"
        label="Your terms for the balance (optional)"
        rows={3}
        defaultValue={e?.operator_cancellation_terms}
        hint="E.g. weather policy. HostSays's deposit rules are shown to guests separately."
      />
    </ActionForm>
  );
}

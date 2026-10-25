"use client";

import { Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveTemplateAction } from "@/actions/templates";
import { Button, Card, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { PRIORITIES, type PriorityValue } from "@/core/priority";
import {
  ANCHOR_SUBMITTED,
  BUILTIN_VARIABLES,
  FIELD_TYPES,
  type FieldType,
  type TemplateField,
  type TemplateInput,
  type TemplateRule,
} from "@/core/template-schema";
import { useI18n } from "@/i18n/provider";

type FieldDraft = TemplateField & { uid: string; keyEdited: boolean; optionsText: string };
type RuleDraft = TemplateRule & { subtasksText: string; tagsText: string };

const uid = () => Math.random().toString(36).slice(2, 10);

/** "Hạn nộp báo cáo" → "han_nop_bao_cao", "Größe" → "grosse" (bỏ dấu, ß → ss) */
export function slugifyKey(label: string): string {
  const s = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  if (!s) return "";
  return /^[a-z]/.test(s) ? s : `f_${s}`.slice(0, 40);
}

function toFieldDraft(f: TemplateField): FieldDraft {
  return { ...f, uid: uid(), keyEdited: true, optionsText: f.options.join("\n") };
}
function toRuleDraft(r: TemplateRule): RuleDraft {
  return { ...r, subtasksText: r.subtasks.join("\n"), tagsText: r.tags.join(", ") };
}

function newRule(fields: FieldDraft[]): RuleDraft {
  const dateField = fields.find((f) => f.type === "DATE" || f.type === "DATETIME");
  return toRuleDraft({
    id: uid(),
    title: "",
    description: "",
    priority: "MEDIUM",
    due: { anchor: dateField?.key ?? ANCHOR_SUBMITTED, offsetDays: 0, offsetHours: 0, time: dateField?.type === "DATETIME" ? null : "17:00" },
    condition: null,
    subtasks: [],
    tags: [],
  });
}

export function TemplateBuilder({ initial, id }: { initial?: TemplateInput; id?: string }) {
  const { t } = useI18n();
  const b = t.builder;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fields, setFields] = useState<FieldDraft[]>(() => (initial?.fields ?? []).map(toFieldDraft));
  const [rules, setRules] = useState<RuleDraft[]>(() => (initial?.rules ?? []).map(toRuleDraft));
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([]);
  const [pending, startTransition] = useTransition();

  // Template mới: có sẵn 1 quy tắc trống
  const [initialized, setInitialized] = useState(Boolean(initial));
  if (!initialized) {
    setInitialized(true);
    setRules([newRule([])]);
  }

  const updateField = (i: number, patch: Partial<FieldDraft>) =>
    setFields((all) =>
      all.map((f, j) => {
        if (j !== i) return f;
        const next = { ...f, ...patch };
        if (patch.label !== undefined && !f.keyEdited) next.key = slugifyKey(patch.label);
        return next;
      }),
    );
  const updateRule = (i: number, patch: Partial<RuleDraft>) => setRules((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function addField() {
    setFields((all) => [
      ...all,
      { uid: uid(), key: "", label: "", type: "TEXT", required: false, options: [], defaultValue: "", keyEdited: false, optionsText: "" },
    ]);
  }

  function removeField(i: number) {
    const key = fields[i].key;
    setFields((all) => all.filter((_, j) => j !== i));
    // Bỏ tham chiếu tới trường đã xoá
    setRules((all) =>
      all.map((r) => ({
        ...r,
        due: r.due.anchor === key ? { ...r.due, anchor: ANCHOR_SUBMITTED } : r.due,
        condition: r.condition?.field === key ? null : r.condition,
      })),
    );
  }

  function save() {
    const input: TemplateInput = {
      name,
      description,
      fields: fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.type === "SELECT" ? f.optionsText.split(/\n|,/).map((s) => s.trim()).filter(Boolean) : [],
        defaultValue: f.defaultValue,
      })),
      rules: rules.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        priority: r.priority,
        due: r.due,
        condition: r.condition,
        subtasks: r.subtasksText.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: r.tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      })),
    };
    startTransition(async () => {
      const res = await saveTemplateAction(input, id);
      if (res && !res.ok) {
        setErrors(res.errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const errorFor = (prefix: string) => errors.find((e) => e.path === prefix || e.path.startsWith(`${prefix}.`))?.message;
  const dateFields = fields.filter((f) => (f.type === "DATE" || f.type === "DATETIME") && f.key);
  const variables = [...fields.filter((f) => f.key).map((f) => ({ key: f.key, label: f.label || f.key })), ...BUILTIN_VARIABLES.map((key) => ({ key, label: t.builtinVariables[key] }))];

  return (
    <div className="space-y-8">
      {errors.length > 0 && (
        <Notice tone="danger">
          <p className="mb-1">{b.saveFailed}</p>
          <ul className="list-disc pl-5">
            {[...new Set(errors.map((e) => e.message))].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Notice>
      )}

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-bold">{b.infoTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={b.name} error={errorFor("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={b.namePlaceholder} maxLength={100} />
          </Field>
          <Field label={b.description}>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={b.descriptionPlaceholder} maxLength={1000} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold">{b.fieldsTitle}</h2>
          <p className="text-sm text-fg-2">{b.fieldsHint}</p>
        </div>
        {fields.length === 0 && <p className="text-sm text-fg-2">{b.noFields}</p>}
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.uid} className="space-y-3 rounded-2xl border border-line p-4">
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto_auto] md:items-end">
                <Field label={b.fieldLabel} error={errorFor(`fields.${i}.label`)}>
                  <Input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder={b.fieldLabelPlaceholder} maxLength={80} />
                </Field>
                <Field label={b.fieldKey} error={errorFor(`fields.${i}.key`)}>
                  <Input
                    value={f.key}
                    onChange={(e) => updateField(i, { key: e.target.value.toLowerCase(), keyEdited: true })}
                    placeholder={b.fieldKeyPlaceholder}
                    className="font-mono text-[13px]"
                  />
                </Field>
                <Field label={b.fieldType}>
                  <Select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FieldType })}>
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t.fieldTypes[type]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <label className="flex items-center gap-2 pb-3 text-sm">
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="h-4 w-4" />
                  {b.required}
                </label>
                <button type="button" onClick={() => removeField(i)} aria-label={b.removeField} className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-danger/10 hover:text-danger">
                  <Trash size={16} />
                </button>
              </div>
              {f.type === "SELECT" && (
                <Field label={b.options} hint={b.optionsHint} error={errorFor(`fields.${i}.options`)}>
                  <Textarea value={f.optionsText} onChange={(e) => updateField(i, { optionsText: e.target.value })} className="min-h-20" placeholder={b.optionsPlaceholder} />
                </Field>
              )}
              {f.type !== "CHECKBOX" && (
                <Field label={b.defaultValue}>
                  <Input
                    value={f.defaultValue}
                    onChange={(e) => updateField(i, { defaultValue: e.target.value })}
                    type={f.type === "DATE" ? "date" : f.type === "DATETIME" ? "datetime-local" : f.type === "NUMBER" ? "number" : "text"}
                  />
                </Field>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={addField}>
          <Plus size={15} /> {b.addField}
        </Button>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold">{b.rulesTitle}</h2>
          <p className="text-sm text-fg-2">{b.rulesHint}</p>
        </div>
        <div className="space-y-4">
          {rules.map((r, i) => (
            <RuleEditor
              key={r.id}
              index={i}
              rule={r}
              fields={fields}
              dateFields={dateFields}
              variables={variables}
              error={errorFor(`rules.${i}`)}
              canRemove={rules.length > 1}
              onChange={(patch) => updateRule(i, patch)}
              onRemove={() => setRules((all) => all.filter((_, j) => j !== i))}
            />
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setRules((all) => [...all, newRule(fields)])}>
          <Plus size={15} /> {b.addRule}
        </Button>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/templates" className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold hover:bg-hover">
          {t.common.cancel}
        </Link>
        <Button onClick={save} disabled={pending}>
          {pending ? t.common.saving : b.save}
        </Button>
      </div>
    </div>
  );
}

function RuleEditor({
  index,
  rule,
  fields,
  dateFields,
  variables,
  error,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  rule: RuleDraft;
  fields: FieldDraft[];
  dateFields: FieldDraft[];
  variables: { key: string; label: string }[];
  error?: string;
  canRemove: boolean;
  onChange: (patch: Partial<RuleDraft>) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const b = t.builder;
  const setDue = (patch: Partial<TemplateRule["due"]>) => onChange({ due: { ...rule.due, ...patch } });
  const condField = rule.condition ? fields.find((f) => f.key === rule.condition!.field) : undefined;

  return (
    <div className="space-y-4 rounded-2xl border border-line p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-fg-2">{b.ruleNumber(index + 1)}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} aria-label={b.removeRule} className="flex h-8 w-8 items-center justify-center rounded-full text-fg-2 hover:bg-danger/10 hover:text-danger">
            <X size={16} />
          </button>
        )}
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <Field label={b.ruleTitle}>
        <Input value={rule.title} onChange={(e) => onChange({ title: e.target.value })} placeholder={b.ruleTitlePlaceholder} maxLength={200} />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange({ title: `${rule.title}${rule.title && !rule.title.endsWith(" ") ? " " : ""}{{${v.key}}}` })}
            title={b.insertVariable(v.label)}
            className="rounded-full bg-hover px-2.5 py-1 font-mono text-xs text-fg-2 hover:text-fg"
          >
            {`{{${v.key}}}`}
          </button>
        ))}
      </div>

      <Field label={b.ruleDescription}>
        <Textarea value={rule.description} onChange={(e) => onChange({ description: e.target.value })} className="min-h-16" />
      </Field>

      <div className="grid gap-3 md:grid-cols-4">
        <Field label={b.priority}>
          <Select value={rule.priority} onChange={(e) => onChange({ priority: e.target.value as PriorityValue })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t.priority[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={b.dueFrom}>
          <Select value={rule.due.anchor ?? ""} onChange={(e) => setDue({ anchor: e.target.value || null })}>
            <option value="">{b.noDue}</option>
            <option value={ANCHOR_SUBMITTED}>{b.whenSubmitted}</option>
            {dateFields.map((f) => (
              <option key={f.uid} value={f.key}>
                {b.fieldAnchor(f.label || f.key)}
              </option>
            ))}
          </Select>
        </Field>
        {rule.due.anchor && (
          <>
            <Field label={b.offsetDays} hint={b.offsetDaysHint}>
              <Input type="number" min={-365} max={365} value={rule.due.offsetDays} onChange={(e) => setDue({ offsetDays: Number(e.target.value) || 0 })} />
            </Field>
            <Field label={b.time} hint={b.timeHint}>
              <Input type="time" value={rule.due.time ?? ""} onChange={(e) => setDue({ time: e.target.value || null })} />
            </Field>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={b.condition}>
          <Select
            value={rule.condition?.field ?? ""}
            onChange={(e) => onChange({ condition: e.target.value ? { field: e.target.value, equals: "" } : null })}
          >
            <option value="">{b.always}</option>
            {fields
              .filter((f) => f.key)
              .map((f) => (
                <option key={f.uid} value={f.key}>
                  {f.type === "CHECKBOX" ? b.conditionChecked(f.label || f.key) : b.conditionField(f.label || f.key)}
                </option>
              ))}
          </Select>
        </Field>
        {rule.condition && condField && condField.type !== "CHECKBOX" && (
          <Field label={b.conditionEquals} hint={b.conditionEqualsHint}>
            {condField.type === "SELECT" ? (
              <Select value={rule.condition.equals} onChange={(e) => onChange({ condition: { ...rule.condition!, equals: e.target.value } })}>
                <option value="">{b.anyValue}</option>
                {condField.optionsText
                  .split(/\n|,/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
              </Select>
            ) : (
              <Input value={rule.condition.equals} onChange={(e) => onChange({ condition: { ...rule.condition!, equals: e.target.value } })} />
            )}
          </Field>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={b.subtasks} hint={b.subtasksHint}>
          <Textarea value={rule.subtasksText} onChange={(e) => onChange({ subtasksText: e.target.value })} className="min-h-20" />
        </Field>
        <Field label={b.tags} hint={b.tagsHint}>
          <Input value={rule.tagsText} onChange={(e) => onChange({ tagsText: e.target.value })} placeholder={b.tagsPlaceholder} />
        </Field>
      </div>
    </div>
  );
}

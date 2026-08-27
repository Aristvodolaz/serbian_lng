'use client';

import {
  ExerciseEditorConfig,
  ExercisePayload,
  PayloadAnswer,
  makeId,
} from '@/lib/exercise-templates';
import { WordPicker, WordOption } from './word-picker';

interface Props {
  config: ExerciseEditorConfig;
  payload: ExercisePayload;
  onChange: (payload: ExercisePayload) => void;
}

function promptOf(config: ExerciseEditorConfig, payload: ExercisePayload): Record<string, string> {
  return (payload[config.promptKey] as Record<string, string>) ?? {};
}

function answersOf(payload: ExercisePayload): PayloadAnswer[] {
  return Array.isArray(payload.answers) ? (payload.answers as PayloadAnswer[]) : [];
}

function settingsOf(payload: ExercisePayload): Record<string, boolean> {
  return (payload.settings as Record<string, boolean>) ?? {};
}

// Controlled editor for a typed exercise payload: prompt block (per type),
// answers list with correct-answer mark + optional Word link, and settings.
export function ExercisePayloadEditor({ config, payload, onChange }: Props) {
  const prompt = promptOf(config, payload);
  const answers = answersOf(payload);
  const settings = settingsOf(payload);
  const correctId = payload.correctAnswerId as string | undefined;

  const updatePrompt = (key: string, value: string) => {
    onChange({ ...payload, [config.promptKey]: { ...prompt, [key]: value } });
  };

  const updateAnswer = (index: number, patch: Partial<PayloadAnswer>) => {
    const next = answers.map((a, i) => (i === index ? { ...a, ...patch } : a));
    onChange({ ...payload, answers: next });
  };

  const setCorrect = (index: number) => {
    onChange({ ...payload, correctAnswerId: answers[index].id });
  };

  const addAnswer = () => {
    onChange({ ...payload, answers: [...answers, { id: makeId(), wordId: null }] });
  };

  const removeAnswer = (index: number) => {
    const next = answers.filter((_, i) => i !== index);
    const correct =
      payload.correctAnswerId === answers[index].id ? next[0]?.id : payload.correctAnswerId;
    onChange({ ...payload, answers: next, correctAnswerId: correct });
  };

  const moveAnswer = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= answers.length) return;
    const next = [...answers];
    [next[index], next[j]] = [next[j], next[index]];
    onChange({ ...payload, answers: next });
  };

  const setSetting = (key: string, value: boolean) => {
    onChange({ ...payload, settings: { ...settings, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">{config.promptLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          {config.promptFields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type="text"
                value={prompt[f.key] ?? ''}
                onChange={(e) => updatePrompt(f.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Answers <span className="text-gray-400 font-normal">(mark the correct one)</span>
        </p>
        <div className="space-y-2">
          {answers.map((a, i) => {
            const isCorrect = a.id === correctId;
            return (
              <div
                key={a.id ?? i}
                className={`border rounded-lg p-2 ${
                  isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    title="Mark as correct"
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                      isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isCorrect ? '✓' : ''}
                  </button>
                  <span className="text-xs text-gray-500 whitespace-nowrap">Answer {i + 1}</span>
                  <WordPicker
                    value={a.wordId ? { id: a.wordId } : null}
                    onChange={(w) => updateAnswer(i, { wordId: w ? w.id : null })}
                  />
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveAnswer(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAnswer(i, 1)}
                      disabled={i === answers.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAnswer(i)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Delete answer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {config.answerFields.map((f) => (
                    <input
                      key={f.key}
                      type="text"
                      placeholder={f.label}
                      value={(a as unknown as Record<string, string | undefined>)[f.key] ?? ''}
                      onChange={(e) => updateAnswer(i, { [f.key]: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addAnswer}
            className="px-3 py-1 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400"
          >
            + Add answer
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Settings</p>
        <div className="flex flex-wrap gap-4">
          {config.settings.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings[s.key] ?? s.default}
                onChange={(e) => setSetting(s.key, e.target.checked)}
                className="rounded"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

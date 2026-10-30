"use client";

import { useState } from "react";

import { ToolCallStatus, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

/**
 * The questions an agent asks with ask_user, as gan declares them in
 * custom.askUser of its capabilities: each with ready answers, and the
 * user may write their own. The run waits for the answer, sent back as
 * the call's result.
 */
const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      header: z.string(),
      options: z.array(
        z.object({ label: z.string(), description: z.string().optional() }),
      ),
      multi_select: z.boolean().optional(),
    }),
  ),
});

type Questions = z.infer<typeof QuestionsSchema>;
type Question = Questions["questions"][number];
// What the user chose of one question: labels, and their own answer.
type Choice = { labels: string[]; own: string | null };
const NOTHING: Choice = { labels: [], own: null };

const ResultSchema = z.union([
  z.object({ answers: z.record(z.string(), z.string()) }),
  z.object({ skipped: z.literal(true) }),
]);

/**
 * Show the agent's ask_user calls in the chat and send the answers.
 *
 * The tool is the agent's, not offered to it from here: the page only
 * shows its calls. Keep the hook mounted while the chat is.
 */
export function useAskUser() {
  useHumanInTheLoop({
    name: "ask_user",
    description: "Questions with ready answers, asked of the user.",
    available: false,
    parameters: QuestionsSchema,
    render: (props) => {
      switch (props.status) {
        case ToolCallStatus.InProgress:
          return <p className="ask hint">Asking…</p>;
        case ToolCallStatus.Executing:
          return (
            <AskForm questions={props.args.questions} respond={props.respond} />
          );
        case ToolCallStatus.Complete:
          return (
            <Answered questions={props.args.questions} result={props.result} />
          );
      }
    },
  });
}

function AskForm({
  questions,
  respond,
}: {
  questions: Question[];
  respond: (result: unknown) => Promise<void>;
}) {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [sending, setSending] = useState(false);
  const chosen = questions.map((_, index) => choices[index] ?? NOTHING);
  const answers = chosen.map(answerOf);
  const ready = answers.every((answer) => answer !== "");

  function choose(index: number, choice: Choice) {
    setChoices(chosen.map((old, at) => (at === index ? choice : old)));
  }

  async function send(result: unknown) {
    setSending(true);
    await respond(result);
  }

  return (
    <form
      className="ask"
      onSubmit={(event) => {
        event.preventDefault();
        void send({
          answers: Object.fromEntries(
            questions.map((question, index) => [
              question.question,
              answers[index],
            ]),
          ),
        });
      }}
    >
      {questions.map((question, index) => (
        <QuestionField
          key={question.question}
          question={question}
          choice={chosen[index] ?? NOTHING}
          onChange={(choice) => choose(index, choice)}
        />
      ))}
      <div className="ask-actions">
        <button type="submit" disabled={!ready || sending}>
          Send
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => void send({ skipped: true })}
        >
          Skip
        </button>
      </div>
      {/* CopilotKit holds a message typed now until the run goes on. */}
      <p className="hint">The chat sends new messages after this answer.</p>
    </form>
  );
}

function QuestionField({
  question,
  choice,
  onChange,
}: {
  question: Question;
  choice: Choice;
  onChange: (choice: Choice) => void;
}) {
  const multi = question.multi_select === true;
  const type = multi ? "checkbox" : "radio";

  function toggle(label: string) {
    if (!multi) {
      onChange({ labels: [label], own: null });
      return;
    }
    const labels = choice.labels.includes(label)
      ? choice.labels.filter((chosen) => chosen !== label)
      : [...choice.labels, label];
    onChange({ ...choice, labels });
  }

  function toggleOwn() {
    if (!multi) {
      onChange({ labels: [], own: choice.own ?? "" });
      return;
    }
    onChange({ ...choice, own: choice.own === null ? "" : null });
  }

  return (
    <fieldset>
      <legend>
        <span className="ask-header">{question.header}</span>{" "}
        {question.question}
      </legend>
      {question.options.map((option) => (
        <label key={option.label} className="ask-option">
          <input
            type={type}
            name={question.question}
            checked={choice.labels.includes(option.label)}
            onChange={() => toggle(option.label)}
          />
          <span>
            {option.label}
            {option.description && (
              <span className="hint"> {option.description}</span>
            )}
          </span>
        </label>
      ))}
      <label className="ask-option">
        <input
          type={type}
          name={question.question}
          checked={choice.own !== null}
          onChange={toggleOwn}
        />
        <span>Other</span>
      </label>
      {choice.own !== null && (
        <input
          className="ask-own"
          value={choice.own}
          placeholder="Your answer"
          onChange={(event) => onChange({ ...choice, own: event.target.value })}
          autoFocus
        />
      )}
    </fieldset>
  );
}

function Answered({
  questions,
  result,
}: {
  questions: Question[];
  result: string;
}) {
  const parsed = ResultSchema.safeParse(parseJson(result));
  const answers =
    parsed.success && "answers" in parsed.data ? parsed.data.answers : {};
  const skipped = parsed.success && "skipped" in parsed.data;

  return (
    <dl className="ask answered">
      {questions.map((question) => (
        <div key={question.question}>
          <dt>{question.question}</dt>
          <dd>
            {skipped
              ? "Skipped."
              : (answers[question.question] ?? result)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The answer to one question: the labels chosen, then the user's own. */
function answerOf(choice: Choice): string {
  const own = choice.own?.trim();
  return [...choice.labels, ...(own ? [own] : [])].join(", ");
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

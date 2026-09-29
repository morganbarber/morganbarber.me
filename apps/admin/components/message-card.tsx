import { Archive, CheckCheck, Mail, ShieldAlert, Trash2 } from "lucide-react";
import type { ContactMessage } from "@repo/types";
import { removeMessage, updateMessageStatus } from "@/actions/messages";

/**
 * One contact submission.
 *
 * The message body is rendered as text inside `whitespace-pre-wrap` — never
 * `dangerouslySetInnerHTML`. This content is attacker-controlled by definition:
 * anyone on the internet can submit it, and this dashboard runs with a
 * service-role key, so stored XSS here would be about the worst possible place
 * for it.
 *
 * `mailto:` is built from the stored address, which the database constrains to
 * a valid email shape, and `encodeURIComponent` keeps a crafted local-part from
 * injecting extra mail headers.
 */
export default function MessageCard({ message }: { message: ContactMessage }) {
  const received = new Date(message.created_at);

  return (
    <article className="card">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-bold break-words">{message.name}</p>
          {message.email ? (
            <a
              href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent("Re: your message via morganbarber.me")}`}
              className="text-primary hover:underline break-all"
            >
              {message.email}
            </a>
          ) : (
            <p className="text-muted-foreground text-xs">No reply address given</p>
          )}
        </div>

        <div className="text-right text-xs text-muted-foreground shrink-0">
          <time dateTime={message.created_at}>{received.toLocaleString()}</time>
          {message.referrer_host ? <p className="mt-0.5">via {message.referrer_host}</p> : null}
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words leading-relaxed border-l-2 border-border pl-4 py-1">
        {message.message}
      </p>

      <footer className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
        {message.status !== "read" ? (
          <StatusButton id={message.id} status="read" icon={<CheckCheck className="size-3.5" />}>
            Mark read
          </StatusButton>
        ) : null}

        {message.status !== "new" ? (
          <StatusButton id={message.id} status="new" icon={<Mail className="size-3.5" />}>
            Mark unread
          </StatusButton>
        ) : null}

        {message.status !== "archived" ? (
          <StatusButton id={message.id} status="archived" icon={<Archive className="size-3.5" />}>
            Archive
          </StatusButton>
        ) : null}

        {message.status !== "spam" ? (
          <StatusButton id={message.id} status="spam" icon={<ShieldAlert className="size-3.5" />}>
            Spam
          </StatusButton>
        ) : null}

        <form action={removeMessage.bind(null, message.id)} className="ml-auto">
          <button type="submit" className="btn btn-sm btn-ghost-danger">
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
        </form>
      </footer>
    </article>
  );
}

function StatusButton({
  id,
  status,
  icon,
  children,
}: {
  id: string;
  status: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form action={updateMessageStatus.bind(null, id, status)}>
      <button type="submit" className="btn btn-sm btn-ghost">
        <span aria-hidden="true">{icon}</span>
        {children}
      </button>
    </form>
  );
}

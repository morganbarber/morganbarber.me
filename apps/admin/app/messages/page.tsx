import { redirect } from "next/navigation";
import { AlertTriangle, Mail } from "lucide-react";
import { listContactMessages } from "@repo/data/admin";
import { isAuthenticated } from "@/lib/auth";
import Shell from "@/components/shell";
import MessageCard from "@/components/message-card";

export const dynamic = "force-dynamic";

/**
 * Contact inbox.
 *
 * `contact_messages` is unreadable with the public key, so this is the only
 * place submissions can be seen without going to the Supabase dashboard.
 */
export default async function MessagesPage() {
  if (!(await isAuthenticated())) redirect("/login");

  const { data: messages, error } = await listContactMessages();

  const groups = {
    new: (messages ?? []).filter((message) => message.status === "new"),
    read: (messages ?? []).filter((message) => message.status === "read"),
    archived: (messages ?? []).filter((message) => message.status === "archived"),
    spam: (messages ?? []).filter((message) => message.status === "spam"),
  };

  return (
    <Shell
      title="Messages"
      description="Submissions from the contact form. Message text is shown as plain text and never rendered as HTML."
    >
      {error ? (
        <div className="flex items-start gap-2 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-danger">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="rounded border border-border bg-surface p-10 text-center">
          <Mail className="h-6 w-6 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-10 max-w-3xl">
          <Group title="Unread" messages={groups.new} />
          <Group title="Read" messages={groups.read} />
          <Group title="Archived" messages={groups.archived} />
          <Group title="Spam" messages={groups.spam} />
        </div>
      )}
    </Shell>
  );
}

function Group({
  title,
  messages,
}: {
  title: string;
  messages: Awaited<ReturnType<typeof listContactMessages>>["data"];
}) {
  if (!messages || messages.length === 0) return null;

  return (
    <section>
      <h2 className="font-bold mb-3">
        {title}{" "}
        <span className="text-muted-foreground font-normal">({messages.length})</span>
      </h2>
      <ul className="space-y-3 list-none m-0 p-0">
        {messages.map((message) => (
          <li key={message.id}>
            <MessageCard message={message} />
          </li>
        ))}
      </ul>
    </section>
  );
}

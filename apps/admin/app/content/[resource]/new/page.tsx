import { notFound, redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import Shell from "@/components/shell";
import ResourceForm from "@/components/resource-form";

export const dynamic = "force-dynamic";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login");

  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  // `schema` and `publicPath` are server-side values (a Zod object and a
  // function); neither can cross the server/client boundary, so the form gets
  // only the serialisable parts of the definition.
  const { schema: _schema, publicPath: _publicPath, ...serialisable } = resource;

  return (
    <Shell title={`New ${resource.singular.toLowerCase()}`} description={resource.description}>
      <ResourceForm resource={serialisable} />
    </Shell>
  );
}

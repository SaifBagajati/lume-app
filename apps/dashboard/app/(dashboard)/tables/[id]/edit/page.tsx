import { getTenantContext, prisma } from "@lume-app/shared";
import { notFound } from "next/navigation";
import { TableForm } from "../../components/TableForm";

export default async function EditTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getTenantContext();

  // Fetch the table
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id,
      tenantId: context.tenantId, // Ensure tenant isolation
    },
  });

  if (!table) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500">Edit Table</h1>
        <p className="mt-2 text-slate-600">
          Update the table number for Table {table.number}
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-xl p-6">
          <TableForm
            tableId={table.id}
            initialNumber={table.number}
            initialActive={table.active}
          />
        </div>
      </div>
    </div>
  );
}

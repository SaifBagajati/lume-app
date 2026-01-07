import { getTenantContext } from "@lume-app/shared";
import { TableForm } from "../components/TableForm";

export default async function NewTablePage() {
  const context = await getTenantContext();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500">Add New Table</h1>
        <p className="mt-2 text-slate-600">
          Create a new table and generate a QR code for customer ordering
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-xl p-6">
          <TableForm />
        </div>
      </div>
    </div>
  );
}

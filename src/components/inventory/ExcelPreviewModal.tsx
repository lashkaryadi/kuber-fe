import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";

export function ExcelPreviewModal({
  open,
  onClose,
  rows,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Excel Import Preview" size="xl">
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th>Serial</th>
              <th>Category</th>
              <th>Pieces</th>
              <th>Weight</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={
                  row.isDuplicate
                    ? "bg-red-100"
                    : !row.isValid
                    ? "bg-yellow-100"
                    : ""
                }
              >
                <td>{row.serialNumber}</td>
                <td>{row.category}</td>
                <td>{row.pieces}</td>
                <td>{row.weight}</td>
                <td>
                  {row.isDuplicate
                    ? "Duplicate"
                    : row.isValid
                    ? "OK"
                    : "Invalid"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          Confirm Import
        </Button>
      </div>
    </Modal>
  );
}

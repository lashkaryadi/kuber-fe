import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface ExcelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  rows: any[];
  onConfirm: () => void;
}

export function ExcelPreviewModal({
  open,
  onClose,
  rows,
  onConfirm,
}: ExcelPreviewModalProps) {
  const downloadReport = async () => {
    const result = await api.downloadImportReport(rows);
    if (!result.success) {
      toast({
        title: "Download Failed",
        description: result.message || "Could not download validation report",
        variant: "destructive",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Excel Import Preview" size="xl">
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 border">Serial</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Pieces</th>
              <th className="p-2 border">Weight</th>
              <th className="p-2 border">Status</th>
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
                <td className="p-2 border">{row.serialNumber}</td>
                <td className="p-2 border">{row.category}</td>
                <td className="p-2 border">{row.pieces}</td>
                <td className="p-2 border">{row.weight}</td>
                <td className="p-2 border">
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

      <div className="flex justify-between gap-3 pt-4">
        <Button variant="outline" onClick={downloadReport}>
          📊 Download Validation Report
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm Import</Button>
        </div>
      </div>
    </Modal>
  );
}

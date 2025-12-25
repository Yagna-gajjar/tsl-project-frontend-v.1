import EnrollmentFormNew from "./enrollment-form-modal";

export default function TopSection({ setRateTableData }: { setRateTableData: any }) {
  return (
    <div className="flex w-full h-full overflow-hidden relative bg-background">
      <div className="flex-1 overflow-hidden">
        <EnrollmentFormNew setRateTableData={setRateTableData} />
      </div>
    </div>
  );
}
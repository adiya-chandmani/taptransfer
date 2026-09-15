import { createMerchant } from "../../actions";
import MerchantForm from "../MerchantForm";

// PRD 18장: 새 판매자 추가
export default function NewMerchantPage() {
  return (
    <div>
      <h1 className="mx-auto mb-6 max-w-md text-xl font-bold">새 판매자 추가</h1>
      <MerchantForm action={createMerchant} submitLabel="확인하고 저장" />
    </div>
  );
}
